import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * DELETE /api/settings/store
 * Disconnects the YouCan store from the merchant account.
 * Nullifies youcanStoreId and youcanAccessToken.
 * Creates an audit_log entry (Art. 23).
 */
export async function DELETE() {
  const merchantId = await getMerchantId();

  // Nullify YouCan connection fields
  await db
    .update(merchants)
    .set({
      youcanStoreId: null,
      youcanAccessToken: null,
      consentRecordedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId));

  // Art. 23 — Audit log (obligatoire)
  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "store_disconnect",
    targetType: "merchant",
    targetId: String(merchantId),
    details: JSON.stringify({
      platform: "youcan",
      disconnectedAt: new Date().toISOString(),
    }),
  });

  return NextResponse.json({ ok: true });
}
