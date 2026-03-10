import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Middleware — Auth.js v5 + cookie fallback (YouCan OAuth transition).
 *
 * Domain routing:
 *   nortoo.ma      → public pages only (landing, terms, privacy, data-rights)
 *   app.nortoo.ma  → application (dashboard, login, register, API)
 *
 * Protects /dashboard/* and /api/* (except webhooks/crons) routes.
 * Checks for Auth.js JWT token first, then falls back to the legacy
 * "nortoo_merchant" cookie for backward compatibility with YouCan OAuth flow.
 */

const APP_HOST = "app.nortoo.ma";
const MARKETING_HOST = "nortoo.ma";

// Pages served on the marketing domain (nortoo.ma)
const MARKETING_PATHS = ["/", "/terms", "/privacy", "/data-rights"];

// Routes that DON'T need auth (webhooks use API key auth)
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
  "/invite",
  "/go/",
  "/privacy",
  "/terms",
  "/data-rights",
  "/api/auth/",
  "/api/webhook/",
  "/api/cron/",
  "/api/nrt-panel/",
  "/api/og/",
  "/api/data-rights/submit",
  "/api/team/accept-invite",
  "/api/coupons/validate",
  "/redeem",
  "/nrt-panel/login",
  "/_next/",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.includes(pathname) || pathname.startsWith("/data-rights");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.replace(/:\d+$/, "") ?? "";

  // ── Domain-based routing ──

  // nortoo.ma (marketing) → only serve public pages, redirect app routes to app.nortoo.ma
  if (host === MARKETING_HOST || host === `www.${MARKETING_HOST}`) {
    if (
      !isMarketingPath(pathname) &&
      !pathname.startsWith("/_next") &&
      pathname !== "/favicon.ico" &&
      !pathname.startsWith("/api/data-rights/submit") &&
      !pathname.startsWith("/api/og/")
    ) {
      return NextResponse.redirect(new URL(pathname, `https://${APP_HOST}`));
    }
    return NextResponse.next();
  }

  // app.nortoo.ma → redirect "/" to /dashboard (no landing page on app subdomain)
  if (host === APP_HOST && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Skip public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Admin panel: check nortoo_admin HMAC cookie (separate from Auth.js)
  if (
    pathname.startsWith("/nrt-panel") &&
    !pathname.startsWith("/nrt-panel/login") &&
    !pathname.startsWith("/nrt-panel/accept-invite")
  ) {
    const adminCookie = request.cookies.get("nortoo_admin");
    const adminSecret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SECRET;
    if (!adminCookie?.value || !adminSecret) {
      return NextResponse.redirect(new URL("/nrt-panel/login", request.url));
    }
    const valid = await verifyAdminCookie(adminCookie.value, adminSecret);
    if (!valid) {
      return NextResponse.redirect(new URL("/nrt-panel/login", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes: /dashboard/* and /api/* (except webhooks/crons)
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/");

  if (!isProtected) {
    return NextResponse.next();
  }

  // 1. Check Auth.js JWT token
  try {
    const token = await getToken({ req: request });
    if (token) {
      return NextResponse.next();
    }
  } catch {
    // getToken() throws if AUTH_SECRET is missing — fall through to cookie check
  }

  // 2. Fallback: legacy cookie — DEPRECATED
  //    Accepted for dashboard routes AND dashboard API calls (same-origin fetch).
  //    Webhook/external API routes use API key auth instead.
  const merchantCookie = request.cookies.get("nortoo_merchant");
  if (merchantCookie?.value) {
    const response = NextResponse.next();
    response.headers.set("X-Auth-Method", "legacy-cookie-deprecated");
    return response;
  }

  // Not authenticated
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Non authentifié. Connectez-vous sur /login." },
      { status: 401 }
    );
  }

  // Dashboard routes redirect to /login
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Verify admin HMAC cookie using Web Crypto API (Edge-compatible).
 *
 * Supports three formats:
 * - New:    "adminId:nonce:hmac" → HMAC-SHA256(secret, "adminId:nonce")
 * - Legacy: "nonce:hmac"        → HMAC-SHA256(secret, nonce)
 * - Raw:    raw secret cookie   → direct comparison
 */
async function verifyAdminCookie(cookieValue: string, secret: string): Promise<boolean> {
  const parts = cookieValue.split(":");

  if (parts.length === 3) {
    // New format: adminId:nonce:hmac
    const [adminId, nonce, providedHmac] = parts;
    if (!adminId || isNaN(Number(adminId)) || !nonce || !providedHmac) return false;
    const payload = `${adminId}:${nonce}`;
    return hmacVerify(secret, payload, providedHmac);
  }

  if (parts.length === 2) {
    // Legacy format: nonce:hmac
    const [nonce, providedHmac] = parts;
    if (!nonce || !providedHmac) return false;
    return hmacVerify(secret, nonce, providedHmac);
  }

  // Raw secret cookie (very old legacy) — timing-safe comparison
  const a = new TextEncoder().encode(cookieValue);
  const b = new TextEncoder().encode(secret);
  if (a.byteLength !== b.byteLength) return false;
  return timingSafeEqual(a, b);
}

/** HMAC-SHA256 verify using Web Crypto API (Edge-compatible). */
async function hmacVerify(secret: string, data: string, providedHmac: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    const expectedHmac = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return timingSafeEqual(
      new TextEncoder().encode(providedHmac),
      new TextEncoder().encode(expectedHmac)
    );
  } catch {
    return false;
  }
}

/**
 * Constant-time comparison for Edge runtime (no crypto.timingSafeEqual).
 * Uses XOR accumulator — runs in fixed time regardless of where bytes differ.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let result = 0;
  for (let i = 0; i < a.byteLength; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
