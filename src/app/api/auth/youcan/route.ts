import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * GET /api/auth/youcan
 *
 * Initiates YouCan OAuth flow:
 * 1. Generates a CSRF state token
 * 2. Stores it in an httpOnly cookie
 * 3. Redirects to YouCan authorization endpoint
 */
export async function GET() {
  const clientId = process.env.YOUCAN_CLIENT_ID;
  const redirectUri = process.env.YOUCAN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "YouCan OAuth non configuré. Vérifiez YOUCAN_CLIENT_ID et YOUCAN_REDIRECT_URI." },
      { status: 500 }
    );
  }

  // Generate CSRF state
  const state = randomBytes(16).toString("hex");

  // Build YouCan authorization URL
  const authUrl = new URL("https://seller-area.youcan.shop/admin/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.append("scope[]", "*");

  // YouCan needs state for CSRF protection
  authUrl.searchParams.set("state", state);

  // Redirect with state cookie
  const response = NextResponse.redirect(authUrl.toString());

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
