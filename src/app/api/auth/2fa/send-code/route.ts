import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { db } from "@/db/index";
import { users, merchants, userMfaCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { compare } from "bcryptjs";
import { authLimiter, getClientIp, safeLimit } from "@/lib/rate-limit";
import { buildLoginCodeEmail, sendEmail } from "@/lib/email";

/**
 * POST /api/auth/2fa/send-code
 *
 * Called during login when user has email-based 2FA enabled.
 * Validates email + password, then sends a 6-digit code by email.
 *
 * Body: { email, password }
 * Returns: { codeSent: true }
 *
 * Security:
 * - Rate limited: reuses authLimiter (5 attempts / 15 min per IP)
 * - bcrypt password verification
 * - Constant-time response (dummy hash if email not found)
 * - Code: 6-digit, SHA-256 hashed in DB, 10-min expiry
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // Rate limiting
    const { success, reset } = await safeLimit(
      authLimiter,
      `2fa-send:${ip}`
    );
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Lookup user with email 2FA enabled
    const results = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userPasswordHash: users.passwordHash,
        userStatus: users.status,
        twoFactorEnabled: users.twoFactorEnabled,
        twoFactorMethod: users.twoFactorMethod,
        merchantLocale: merchants.locale,
      })
      .from(users)
      .innerJoin(merchants, eq(users.merchantId, merchants.id))
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const row = results[0];

    if (!row || !row.userPasswordHash || row.userStatus !== "active") {
      // Constant-time: still run bcrypt to prevent timing attack
      await compare(
        password,
        "$2a$12$000000000000000000000uGmTdzHzgfGKaEVVFtLH.wz9dMH0Gy.6"
      );
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await compare(password, row.userPasswordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    // Check that email 2FA is enabled
    if (!row.twoFactorEnabled || row.twoFactorMethod !== "email") {
      return NextResponse.json(
        { error: "La 2FA par email n'est pas activée." },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = String(randomInt(100000, 1000000));
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store hashed code
    await db.insert(userMfaCodes).values({
      userId: row.userId,
      codeHash,
      expiresAt,
    });

    // Send code by email
    const locale = (row.merchantLocale as "fr" | "en") || "fr";
    try {
      const built = await buildLoginCodeEmail(code, row.userName, locale);
      const sent = await sendEmail({
        to: row.userEmail,
        subject: built.subject,
        html: built.html,
        text: built.text,
      });
      if (!sent) {
        console.error(`[2FA Email] Send returned false — email: ${row.userEmail}`);
      }
    } catch (emailErr) {
      console.error("[2FA Email] Send error:", emailErr);
      return NextResponse.json(
        { error: "Impossible d'envoyer le code. Réessayez." },
        { status: 500 }
      );
    }

    console.info(`[2FA Email] Code sent — email: ${row.userEmail}, IP: ${ip}`);

    return NextResponse.json({ codeSent: true });
  } catch (err) {
    console.error(`[2FA Email] Server error — IP: ${ip}`, err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
