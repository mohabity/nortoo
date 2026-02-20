import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db/index";
import { emailVerificationTokens, merchants, auditLogs } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * GET /api/auth/verify-email?token=XXXXX
 * No auth required (merchant may click from a different device).
 * Verifies the token, marks the email as verified, redirects to dashboard.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/dashboard?verify=invalid", request.url)
    );
  }

  // Hash the incoming token
  const hashedToken = createHash("sha256").update(token).digest("hex");

  // Find unused token
  const [record] = await db
    .select({
      id: emailVerificationTokens.id,
      merchantId: emailVerificationTokens.merchantId,
      email: emailVerificationTokens.email,
      expiresAt: emailVerificationTokens.expiresAt,
    })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, hashedToken),
        isNull(emailVerificationTokens.usedAt)
      )
    )
    .limit(1);

  if (!record) {
    return NextResponse.redirect(
      new URL("/dashboard?verify=invalid", request.url)
    );
  }

  // Check expiration
  if (new Date() > record.expiresAt) {
    return NextResponse.redirect(
      new URL("/dashboard?verify=expired", request.url)
    );
  }

  // Mark email as verified on merchant
  await db
    .update(merchants)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(merchants.id, record.merchantId));

  // Mark token as used
  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, record.id));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId: record.merchantId,
    actor: "merchant",
    action: "email_verified",
    targetType: "merchant",
    targetId: String(record.merchantId),
    details: JSON.stringify({ email: record.email }),
  });

  return NextResponse.redirect(
    new URL("/dashboard?verify=success", request.url)
  );
}
