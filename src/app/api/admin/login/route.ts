import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import {
  adminLoginLimiter,
  getClientIp,
  isRateLimitConfigured,
} from "@/lib/rate-limit";

/**
 * POST /api/admin/login
 * Validates password against ADMIN_SECRET, sets httpOnly cookie.
 *
 * Security:
 * - Rate limited: 5 attempts / 15 min per IP
 * - timingSafeEqual comparison
 * - Failed attempts logged with IP
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // ── Rate limiting ──
    if (isRateLimitConfigured()) {
      const { success, remaining, reset } = await adminLoginLimiter.limit(
        `admin:${ip}`
      );
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        console.warn(
          `[Admin Login] Rate limited — IP: ${ip}, remaining: ${remaining}`
        );
        return NextResponse.json(
          {
            error:
              "Trop de tentatives. Réessayez dans 15 minutes.",
          },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Mot de passe requis" },
        { status: 400 }
      );
    }

    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      console.error("[Admin Login] ADMIN_SECRET env var is not set");
      return NextResponse.json(
        { error: "Configuration manquante" },
        { status: 500 }
      );
    }

    // Timing-safe comparison
    const isValid = safeCompare(password, secret);
    if (!isValid) {
      console.warn(
        `[Admin Login] Failed attempt — IP: ${ip}, time: ${new Date().toISOString()}`
      );
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // ── Success ──
    console.info(
      `[Admin Login] Successful login — IP: ${ip}, time: ${new Date().toISOString()}`
    );

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch {
    console.error(`[Admin Login] Server error — IP: ${ip}`);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
