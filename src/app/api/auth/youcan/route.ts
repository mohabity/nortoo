import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * GET /api/auth/youcan
 *
 * Initiates YouCan OAuth flow:
 * 1. Reads ?mode=login|register and ?invite=CODE
 * 2. Generates a CSRF state token
 * 3. Stores csrf + mode + invite in an httpOnly cookie
 * 4. Redirects to YouCan authorization endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode") || "login";
  const invite = searchParams.get("invite") || "";

  const clientId = process.env.YOUCAN_CLIENT_ID;
  const redirectUri = process.env.YOUCAN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "YouCan OAuth non configuré. Vérifiez YOUCAN_CLIENT_ID et YOUCAN_REDIRECT_URI." },
      { status: 500 }
    );
  }

  // Generate CSRF state
  const csrf = randomBytes(16).toString("hex");

  // Build YouCan authorization URL
  const authUrl = new URL("https://seller-area.youcan.shop/admin/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.append("scope[]", "*");
  authUrl.searchParams.set("state", csrf);

  // Store mode + invite + CSRF in cookie (callback will parse the JSON)
  const statePayload = JSON.stringify({ csrf, mode, invite });

  const response = NextResponse.redirect(authUrl.toString());

  response.cookies.set("oauth_state", statePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
