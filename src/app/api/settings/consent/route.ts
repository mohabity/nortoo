import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * POST /api/settings/consent
 * Records the merchant's data processing consent (Loi 09-08 Art. 5).
 * Used from the Privacy tab when consent wasn't recorded during onboarding.
 */
export async function POST() {
  const merchantId = await getMerchantId();

  await db
    .update(merchants)
    .set({
      consentRecordedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId));

  // Audit log — Art. 23
  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "consent_recorded",
    targetType: "merchant",
    targetId: String(merchantId),
    details: JSON.stringify({ source: "settings" }),
  });

  return NextResponse.json({
    data: { success: true, consentRecordedAt: new Date().toISOString() },
  });
}
