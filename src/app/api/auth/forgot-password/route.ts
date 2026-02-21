import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/db/index";
import { users, passwordResetTokens, auditLogs } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";

// ── In-memory rate limit: 3 requests per email per hour ──
const rateLimitMap = new Map<string, { count: number; firstAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(email, { count: 1, firstAt: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 * Always returns { success: true } to avoid revealing if email exists.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Adresse email invalide" },
      { status: 400 }
    );
  }

  // Rate limit check
  if (isRateLimited(email)) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  // Lookup user — always return success regardless
  const [user] = await db
    .select({
      id: users.id,
      merchantId: users.merchantId,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    // Don't reveal that email doesn't exist
    return NextResponse.json({ success: true });
  }

  // Invalidate all existing unused tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  // Generate token: 48 random bytes → 96-char hex string
  const rawToken = randomBytes(48).toString("hex");
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");

  // Store hashed token in DB
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db.insert(passwordResetTokens).values({
    merchantId: user.merchantId,
    userId: user.id,
    token: hashedToken,
    expiresAt,
  });

  // Build reset URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  // Send email
  const { html, text } = buildPasswordResetEmail(resetUrl);
  await sendEmail({
    to: user.email,
    subject: "Réinitialisation de mot de passe — nortoo",
    html,
    text,
  });

  // Audit log
  const ipHash = request.headers.get("x-forwarded-for") || "unknown";
  await db.insert(auditLogs).values({
    merchantId: user.merchantId,
    userId: user.id,
    actor: "merchant",
    action: "password_reset_requested",
    targetType: "user",
    targetId: String(user.id),
    details: JSON.stringify({ email, ip: ipHash }),
  });

  const response: Record<string, unknown> = { success: true };

  // Dev hint if no email provider
  if (!process.env.RESEND_API_KEY) {
    response.devNote =
      "Email logged to console (no email provider configured)";
  }

  return NextResponse.json(response);
}
