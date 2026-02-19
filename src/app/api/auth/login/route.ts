import { NextResponse } from "next/server";

/**
 * POST /api/auth/login
 *
 * MVP Auth: Any valid email sets the codpilot_merchant cookie to "1"
 * (the DEMO_MERCHANT_ID). Phase 2 will replace with Auth.js + OAuth.
 */
export async function POST(request: Request) {
  let body: { email?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON invalide" },
      { status: 400 }
    );
  }

  const email = body.email?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Adresse email invalide" },
      { status: 400 }
    );
  }

  // MVP: Accept any email, set merchant cookie to demo merchant ID
  const response = NextResponse.json({ ok: true });

  response.cookies.set("codpilot_merchant", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
