import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { sendVerificationEmail } from "@/lib/email-verification";

// ── In-memory rate limit: 3 requests per merchant per hour ──
const rateLimitMap = new Map<number, { count: number; firstAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(merchantId: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(merchantId);

  if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(merchantId, { count: 1, firstAt: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * POST /api/auth/verify-email/send
 * Auth required. Sends a verification email to the current merchant.
 * Rate limited to 3 per hour.
 */
export async function POST() {
  const merchantId = await getMerchantId();

  // Fetch merchant
  const [merchant] = await db
    .select({
      email: merchants.email,
      emailVerified: merchants.emailVerified,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  // Already verified
  if (merchant.emailVerified) {
    return NextResponse.json(
      { error: "Email d\u00e9j\u00e0 v\u00e9rifi\u00e9" },
      { status: 400 }
    );
  }

  // Rate limit
  if (isRateLimited(merchantId)) {
    return NextResponse.json(
      { error: "Trop de demandes. R\u00e9essayez dans quelques minutes." },
      { status: 429 }
    );
  }

  // Send verification email
  const sent = await sendVerificationEmail(merchantId, merchant.email);

  const response: Record<string, unknown> = { success: true };
  if (!sent) {
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    response.devNote = "Email logged to console (no email provider configured)";
  }

  return NextResponse.json(response);
}
