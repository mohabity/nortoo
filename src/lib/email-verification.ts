import { createHash, randomBytes } from "crypto";
import { db } from "@/db/index";
import { emailVerificationTokens, merchants, auditLogs } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { sendEmail, buildEmailVerificationEmail } from "@/lib/email";

/**
 * Generate a verification token, store SHA-256 in DB, send email.
 * Returns true if the email was sent successfully.
 */
export async function sendVerificationEmail(
  merchantId: number,
  email: string
): Promise<boolean> {
  // Invalidate all existing unused tokens for this merchant
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailVerificationTokens.merchantId, merchantId),
        isNull(emailVerificationTokens.usedAt)
      )
    );

  // Generate token: 48 random bytes → 96-char hex string
  const rawToken = randomBytes(48).toString("hex");
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");

  // Store hashed token in DB, expires in 24h
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(emailVerificationTokens).values({
    merchantId,
    email,
    token: hashedToken,
    expiresAt,
  });

  // Build verification URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

  // Send email
  const { html, text } = await buildEmailVerificationEmail(verifyUrl);
  const sent = await sendEmail({
    to: email,
    subject: "V\u00e9rifiez votre email \u2014 nortoo",
    html,
    text,
  });

  return sent;
}

/**
 * Check if a merchant's email requires verification enforcement.
 * Returns true if the merchant can use restricted features.
 * - Email verified → always true
 * - Within 7-day grace period → true
 * - After 7 days without verification → false
 */
export function isEmailVerifiedOrGrace(
  emailVerified: Date | string | null,
  createdAt: Date | string
): boolean {
  if (emailVerified) return true;

  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const daysSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= 7;
}

/**
 * Guard for restricted API routes. Fetches merchant and checks verification.
 * Returns { allowed: true } or { allowed: false, response: NextResponse }.
 */
export async function requireVerifiedEmail(merchantId: number): Promise<
  | { allowed: true }
  | { allowed: false; error: string; code: string }
> {
  const [merchant] = await db
    .select({
      emailVerified: merchants.emailVerified,
      createdAt: merchants.createdAt,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return { allowed: false, error: "Marchand introuvable", code: "NOT_FOUND" };
  }

  if (isEmailVerifiedOrGrace(merchant.emailVerified, merchant.createdAt)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: "V\u00e9rifiez votre email pour acc\u00e9der \u00e0 cette fonctionnalit\u00e9.",
    code: "EMAIL_NOT_VERIFIED",
  };
}
