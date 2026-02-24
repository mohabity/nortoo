import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db/index";
import { users, merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        totpCode: { label: "Code 2FA", type: "text" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email as string;
        const password = credentials?.password as string;
        const totpCode = (credentials?.totpCode as string) || "";
        if (!rawEmail || !password) return null;
        const email = rawEmail.trim().toLowerCase();

        // 1. Try users table first (normal flow)
        const results = await db
          .select({
            userId: users.id,
            userEmail: users.email,
            userName: users.name,
            userPasswordHash: users.passwordHash,
            userRole: users.role,
            userStatus: users.status,
            userTwoFactorEnabled: users.twoFactorEnabled,
            userTwoFactorSecret: users.twoFactorSecret,
            merchantId: merchants.id,
            merchantPlan: merchants.plan,
          })
          .from(users)
          .innerJoin(merchants, eq(users.merchantId, merchants.id))
          .where(eq(users.email, email))
          .limit(1);

        const row = results[0];

        // 2. If no user row, attempt lazy migration from merchants table
        if (!row) {
          return await lazyMigrateAndAuth(email, password);
        }

        // Pending invite (no password set yet)
        if (!row.userPasswordHash) return null;
        // Disabled or pending
        if (row.userStatus !== "active") return null;

        const valid = await compare(password, row.userPasswordHash);
        if (!valid) return null;

        // 2FA check: if enabled, require TOTP code
        if (row.userTwoFactorEnabled && row.userTwoFactorSecret) {
          if (!totpCode) {
            // Signal that 2FA is required
            throw new Error("2FA_REQUIRED");
          }
          const { verifyTOTPCode } = await import("@/lib/totp");
          if (!verifyTOTPCode(row.userTwoFactorSecret, totpCode)) {
            throw new Error("2FA_INVALID");
          }
        }

        // Update lastLoginAt
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, row.userId));

        return {
          id: String(row.userId),
          email: row.userEmail,
          name: row.userName,
          merchantId: row.merchantId,
          role: row.userRole,
          plan: row.merchantPlan,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = Number(user.id);
        token.merchantId = (user as unknown as { merchantId: number })
          .merchantId;
        token.role = (user as unknown as { role: string }).role;
        token.plan = (user as unknown as { plan: string }).plan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.userId = token.userId as number;
      session.user.merchantId = token.merchantId as number;
      session.user.role = token.role as string;
      session.user.plan = token.plan as string;
      return session;
    },
  },
});

/**
 * Lazy migration: If user row doesn't exist but merchant row with matching
 * email does, create an admin user row automatically.
 * Handles pre-migration merchants on first login after feature deploy.
 */
async function lazyMigrateAndAuth(email: string, password: string) {
  const [merchant] = await db
    .select({
      id: merchants.id,
      email: merchants.email,
      name: merchants.name,
      plan: merchants.plan,
      passwordHash: merchants.passwordHash,
    })
    .from(merchants)
    .where(eq(merchants.email, email))
    .limit(1);

  if (!merchant || !merchant.passwordHash) return null;

  const valid = await compare(password, merchant.passwordHash);
  if (!valid) return null;

  // Create admin user row from merchant data
  const [newUser] = await db
    .insert(users)
    .values({
      merchantId: merchant.id,
      email: merchant.email,
      name: merchant.name,
      passwordHash: merchant.passwordHash,
      role: "admin",
      status: "active",
      lastLoginAt: new Date(),
    })
    .returning({ id: users.id });

  return {
    id: String(newUser.id),
    email: merchant.email,
    name: merchant.name,
    merchantId: merchant.id,
    role: "admin",
    plan: merchant.plan,
  };
}
