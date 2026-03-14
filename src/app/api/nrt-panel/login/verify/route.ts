import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db/index";
import { adminUsers, adminMfaCodes, auditLogs } from "@/db/schema";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { ADMIN_COOKIE_NAME, createAdminToken } from "@/lib/admin-auth";
import {
  adminMfaLimiter,
  getClientIp,
  safeLimit,
} from "@/lib/rate-limit";

/**
 * POST /api/nrt-panel/login/verify
 *
 * Step 2 of admin login: verify 6-digit MFA code sent by email.
 * On success, sets httpOnly session cookie and logs the login.
 *
 * Security:
 * - Rate limited: 5 attempts / 10 min per IP
 * - Code is SHA-256 hashed in DB (never stored in plain text)
 * - Code expires after 10 minutes
 * - Code can only be used once
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // ── Rate limiting ──
    const { success, reset } = await safeLimit(
      adminMfaLimiter,
      `admin-mfa:${ip}`
    );
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      console.warn(`[Admin MFA] Rate limited — IP: ${ip}`);
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

    const { email, code } = body as { email?: string; code?: string };

    if (
      !email ||
      !code ||
      typeof email !== "string" ||
      typeof code !== "string" ||
      code.length !== 6 ||
      !/^\d{6}$/.test(code)
    ) {
      return NextResponse.json(
        { error: "Code invalide." },
        { status: 400 }
      );
    }

    // Lookup admin by email
    const [admin] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
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
      return NextResponse.json(
        { error: "Code invalide ou expiré." },
        { status: 401 }
      );
    }

    // Find valid, unused, unexpired code for this admin
    const codeHash = createHash("sha256").update(code).digest("hex");
    const [validCode] = await db
      .select({ id: adminMfaCodes.id })
      .from(adminMfaCodes)
      .where(
        and(
          eq(adminMfaCodes.adminUserId, admin.id),
          eq(adminMfaCodes.codeHash, codeHash),
          isNull(adminMfaCodes.usedAt),
          gte(adminMfaCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(adminMfaCodes.createdAt))
      .limit(1);

    if (!validCode) {
      console.warn(
        `[Admin MFA] Invalid code — email: ${admin.email}, IP: ${ip}`
      );
      return NextResponse.json(
        { error: "Code invalide ou expiré." },
        { status: 401 }
      );
    }

    // ── Mark code as used ──
    await db
      .update(adminMfaCodes)
      .set({ usedAt: new Date() })
      .where(eq(adminMfaCodes.id, validCode.id));

    // ── Update lastLoginAt ──
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(adminUsers.id, admin.id));

    // ── Audit log (Art. 23) ──
    await db.insert(auditLogs).values({
      actor: "admin",
      action: "login",
      targetType: "admin_user",
      targetId: String(admin.id),
      details: JSON.stringify({
        email: admin.email,
        name: admin.name,
        method: "email_mfa",
      }),
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
    });

    // ── Set session cookie ──
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Configuration serveur manquante." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminToken(admin.id, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.info(
      `[Admin Login] Successful MFA login — email: ${admin.email}, adminId: ${admin.id}, IP: ${ip}`
    );

    return response;
  } catch (err) {
    console.error(`[Admin MFA] Server error — IP: ${ip}`, err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
