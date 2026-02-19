import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * MVP Auth Middleware.
 *
 * Protects /dashboard/* and /api/* (except webhooks) routes.
 * Checks for a "codpilot_merchant" cookie containing the merchantId.
 * Phase 2 will replace this with Auth.js session validation.
 */

// Routes that DON'T need auth (webhooks use API key auth)
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/",
  "/api/webhook/",
  "/api/cron/",
  "/_next/",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Skip root page (it redirects to /dashboard, middleware will catch there)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Protected routes: /dashboard/* and /api/* (except webhooks/crons)
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/");

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const merchantCookie = request.cookies.get("codpilot_merchant");

  if (!merchantCookie?.value) {
    // API routes return 401 JSON
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

  return NextResponse.next();
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
