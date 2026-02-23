import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Middleware — Auth.js v5 + cookie fallback (YouCan OAuth transition).
 *
 * Protects /dashboard/* and /api/* (except webhooks/crons) routes.
 * Checks for Auth.js JWT token first, then falls back to the legacy
 * "nortoo_merchant" cookie for backward compatibility with YouCan OAuth flow.
 */

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
  "/api/admin/",
  "/api/team/accept-invite",
  "/admin/login",
  "/_next/",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Skip root page (it redirects to /dashboard, middleware will catch there)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Admin panel: check nortoo_admin cookie (separate from Auth.js)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminCookie = request.cookies.get("nortoo_admin");
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminCookie?.value || !adminSecret || adminCookie.value !== adminSecret) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
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
