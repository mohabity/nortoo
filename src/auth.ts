import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

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

        return {
          id: String(merchant.id),
          email: merchant.email,
          name: merchant.name,
          plan: merchant.plan,
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
        token.merchantId = Number(user.id);
        token.plan = (user as unknown as { plan: string }).plan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.merchantId = token.merchantId as number;
      session.user.plan = token.plan as string;
      return session;
    },
  },
});
