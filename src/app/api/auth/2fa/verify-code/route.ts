import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db/index";
import { users, userMfaCodes } from "@/db/schema";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { authLimiter, getClientIp, safeLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/2fa/verify-code
 *
 * Verifies a 6-digit email MFA code during merchant login.
 * Called after send-code, before signIn() completes.
 *
 * Body: { email, code }
 * Returns: { valid: true } — the client then calls signIn() with the verified code
 *
 * Security:
 * - Rate limited: 5 attempts / 15 min per IP
 * - Code is SHA-256 hashed in DB
 * - Code expires after 10 minutes
 * - Code can only be used once
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // Rate limiting
    const { success, reset } = await safeLimit(
      authLimiter,
      `2fa-verify:${ip}`
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

    const normalizedEmail = email.trim().toLowerCase();

    // Lookup user
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, normalizedEmail),
          eq(users.status, "active")
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Code invalide ou expiré." },
        { status: 401 }
      );
    }

    // Find valid, unused, unexpired code
    const codeHash = createHash("sha256").update(code).digest("hex");
    const [validCode] = await db
      .select({ id: userMfaCodes.id })
      .from(userMfaCodes)
      .where(
        and(
          eq(userMfaCodes.userId, user.id),
          eq(userMfaCodes.codeHash, codeHash),
          isNull(userMfaCodes.usedAt),
          gte(userMfaCodes.expiresAt, new Date())
        )
      )
      .orderBy(desc(userMfaCodes.createdAt))
      .limit(1);

    if (!validCode) {
      console.warn(`[2FA Verify] Invalid code — email: ${normalizedEmail}, IP: ${ip}`);
      return NextResponse.json(
        { error: "Code invalide ou expiré." },
        { status: 401 }
      );
    }

    // Mark code as used
    await db
      .update(userMfaCodes)
      .set({ usedAt: new Date() })
      .where(eq(userMfaCodes.id, validCode.id));

    console.info(`[2FA Verify] Code verified — email: ${normalizedEmail}, IP: ${ip}`);

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error(`[2FA Verify] Server error — IP: ${ip}`, err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
