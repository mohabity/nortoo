import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { db } from "@/db/index";
import { adminUsers, adminMfaCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  adminLoginLimiter,
  getClientIp,
  safeLimit,
} from "@/lib/rate-limit";
import { buildAdminLoginCodeEmail, sendEmail } from "@/lib/email";

/**
 * POST /api/nrt-panel/login
 *
 * Step 1 of admin login: validate email + password, then send MFA code by email.
 *
 * Security:
 * - Rate limited: 5 attempts / 15 min per IP
 * - bcrypt password verification
 * - Constant-time response (dummy hash if email not found — anti timing attack)
 * - MFA code: 6-digit, SHA-256 hashed in DB, 10-min expiry
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // ── Rate limiting ──
    const { success, reset } = await safeLimit(
      adminLoginLimiter,
      `admin:${ip}`
    );
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      console.warn(`[Admin Login] Rate limited — IP: ${ip}`);
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    // Lookup admin by email
    const [admin] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        passwordHash: adminUsers.passwordHash,
      })
      .from(adminUsers)
      .where(
        and(
          eq(adminUsers.email, email.trim().toLowerCase()),
          eq(adminUsers.isActive, true)
        )
      )
      .limit(1);

    if (!admin) {
      // Constant-time: still run bcrypt to prevent timing attack revealing email existence
      await compare(
        password,
        "$2a$12$000000000000000000000uGmTdzHzgfGKaEVVFtLH.wz9dMH0Gy.6"
      );
      console.warn(
        `[Admin Login] Unknown email — IP: ${ip}, time: ${new Date().toISOString()}`
      );
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    // Verify bcrypt password (passwordHash is nullable for pending invites)
    if (!admin.passwordHash) {
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 }
      );
    }
    const isValid = await compare(password, admin.passwordHash);
    if (!isValid) {
      console.warn(
        `[Admin Login] Wrong password — email: ${admin.email}, IP: ${ip}, time: ${new Date().toISOString()}`
      );
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    // ── Generate 6-digit MFA code ──
    const code = String(randomInt(100000, 1000000));
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store hashed code in DB
    await db.insert(adminMfaCodes).values({
      adminUserId: admin.id,
      codeHash,
      expiresAt,
    });

    // Send MFA code by email (must await — serverless kills fire-and-forget)
    try {
      const built = await buildAdminLoginCodeEmail(code, admin.name, "fr");
      const sent = await sendEmail({
        to: admin.email,
        subject: built.subject,
        html: built.html,
        text: built.text,
      });
      if (!sent) {
        console.error(`[Admin MFA] Email send returned false — email: ${admin.email}`);
      }
    } catch (emailErr) {
      console.error("[Admin MFA] Email send error:", emailErr);
      return NextResponse.json(
        { error: "Impossible d'envoyer le code de vérification. Réessayez." },
        { status: 500 }
      );
    }

    console.info(
      `[Admin Login] MFA code sent — email: ${admin.email}, IP: ${ip}`
    );

    return NextResponse.json({ mfaRequired: true });
  } catch (err) {
    console.error(`[Admin Login] Server error — IP: ${ip}`, err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
