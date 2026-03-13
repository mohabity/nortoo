import { db } from "@/db/index";
import { orders, auditLogs, oppositionList, notifications, phoneList } from "@/db/schema";
import { and, eq, or, isNull } from "drizzle-orm";
import { shouldNotify } from "@/lib/notification-helper";
import type { IngestResult, PhoneListOverride } from "./types";
import { retentionDate } from "./types";

/** Check if phone is on merchant blacklist/whitelist */
export async function lookupPhoneList(
  merchantId: number,
  phoneHash: string,
): Promise<PhoneListOverride | null> {
  const [listed] = await db
    .select({ listType: phoneList.listType, reason: phoneList.reason })
    .from(phoneList)
    .where(and(eq(phoneList.merchantId, merchantId), eq(phoneList.phoneHash, phoneHash)))
    .limit(1);

  if (!listed) return null;

  if (listed.listType === "blacklist") {
    return {
      decision: "block",
      reason: `Blacklisted: ${listed.reason || "Numéro bloqué par le marchand"}`,
    };
  }
  return {
    decision: "ship",
    reason: `Whitelisted: ${listed.reason || "Client VIP"}`,
  };
}

/** Check opposition list (Art. 9 — consumer data rights) */
export async function checkOpposition(merchantId: number, phoneHash: string): Promise<boolean> {
  const [opposition] = await db
    .select({ id: oppositionList.id })
    .from(oppositionList)
    .where(
      and(
        eq(oppositionList.phoneHash, phoneHash),
        or(eq(oppositionList.merchantId, merchantId), isNull(oppositionList.merchantId))
      )
    )
    .limit(1);

  return !!opposition;
}

/** Handle opposed consumer — scoring disabled, flag for manual review */
export async function handleOpposedOrder(params: {
  merchantId: number;
  merchant: { dataRetentionMonths: number };
  ref: string;
  externalId?: string;
  customerName?: string;
  last4: string;
  productName?: string;
  total: number;
  currency: string;
  shippingCity?: string;
  shippingAddress?: string;
  isTest: boolean;
}): Promise<IngestResult> {
  const now = new Date();
  const [insertedOrder] = await db
    .insert(orders)
    .values({
      merchantId: params.merchantId,
      externalId: params.externalId,
      externalRef: params.ref,
      customerName: params.customerName,
      customerPhoneLast4: params.last4,
      productName: params.productName,
      total: params.total,
      currency: params.currency,
      shippingCity: params.shippingCity,
      shippingAddress: params.shippingAddress,
      fraudScore: 25,
      riskLevel: "low",
      decision: "flag",
      scoringFactors: JSON.stringify([{ rule: "OPPOSITION", points: 0, reason: "Consommateur opposé (Art. 9) — scoring désactivé" }]),
      scoringVersion: "v1.1",
      pipelineStatus: "needs_review",
      pipelineProcessedAt: now,
      merchantNotifiedAt: now,
      isTest: params.isTest,
      retentionExpiresAt: retentionDate(params.merchant.dataRetentionMonths),
    })
    .returning({ id: orders.id });

  await db.insert(auditLogs).values({
    merchantId: params.merchantId,
    actor: "system",
    action: "score",
    targetType: "order",
    targetId: String(insertedOrder.id),
    details: JSON.stringify({ score: 25, decision: "flag", reason: "opposition_active" }),
  });

  if (!params.isTest && await shouldNotify(params.merchantId, "order_flagged")) {
    await db.insert(notifications).values({
      merchantId: params.merchantId,
      orderId: insertedOrder.id,
      type: "order_flagged",
      title: `Commande ${params.ref} — opposition active`,
      message: `Consommateur opposé (Art. 9). Scoring désactivé, vérification manuelle requise.`,
      severity: "warning",
      actionUrl: `/dashboard/orders?selected=${insertedOrder.id}`,
    });
  }

  return {
    orderId: insertedOrder.id,
    score: 25,
    decision: "flag",
    riskLevel: "low",
    factors: [{ rule: "OPPOSITION", points: 0, reason: "Consommateur opposé (Art. 9)" }],
    confidence: 0.5,
    opposed: true,
    pipelineStatus: "needs_review",
    reviewDeadline: null,
    isTest: params.isTest,
  };
}
