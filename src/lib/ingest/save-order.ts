import { db } from "@/db/index";
import { orders, auditLogs, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { executePipeline } from "@/lib/pipeline";
import { shouldNotify } from "@/lib/notification-helper";
import { buildSearchIndex } from "@/lib/search";
import type { IngestParams, GeoData, ScoredOrder, PhoneListOverride } from "./types";
import { retentionDate } from "./types";

/** Insert order + audit logs + execute pipeline + notifications */
export async function saveOrder(params: {
  merchantId: number;
  customerId: number;
  externalId?: string;
  ref: string;
  customerName?: string;
  last4: string;
  productName?: string;
  resolvedProductId?: string;
  productCategory?: string;
  productPrice?: number;
  quantity?: number;
  total: number;
  currency: string;
  shippingCity?: string;
  shippingAddress?: string;
  geoData: GeoData;
  scored: ScoredOrder;
  phoneListOverride: PhoneListOverride | null;
  merchant: IngestParams["merchant"];
  isTest: boolean;
}): Promise<{
  orderId: number;
  pipelineResult: ReturnType<typeof executePipeline>;
  finalDecision: string;
}> {
  const now = new Date();
  const { scored, phoneListOverride } = params;

  // Insert order
  const [insertedOrder] = await db
    .insert(orders)
    .values({
      merchantId: params.merchantId,
      customerId: params.customerId,
      externalId: params.externalId,
      externalRef: params.ref,
      customerName: params.customerName,
      customerPhoneLast4: params.last4,
      productName: params.productName,
      productId: params.resolvedProductId,
      productCategory: params.productCategory,
      productPrice: params.productPrice,
      quantity: params.quantity,
      total: params.total,
      currency: params.currency,
      shippingCity: params.shippingCity,
      shippingAddress: params.shippingAddress,
      parsedCity: params.geoData.parsedCity,
      parsedZone: params.geoData.parsedZone,
      parsedPostalCode: params.geoData.parsedPostalCode,
      addressConfidence: params.geoData.addressConfidence,
      fraudScore: scored.scoringResult.score,
      riskLevel: scored.scoringResult.riskLevel,
      decision: scored.decision,
      overrideDecision: phoneListOverride ? phoneListOverride.decision : undefined,
      overrideBy: phoneListOverride ? "phonelist" : undefined,
      overrideReason: phoneListOverride ? phoneListOverride.reason : undefined,
      overrideAt: phoneListOverride ? now : undefined,
      scoringFactors: JSON.stringify(scored.scoringResult.factors),
      scoreExplanation: JSON.stringify(scored.explanation),
      scoringVersion: scored.scoringResult.version,
      searchIndex: buildSearchIndex({
        externalRef: params.ref,
        customerName: params.customerName,
        shippingCity: params.shippingCity,
        parsedZone: params.geoData.parsedZone,
        shippingAddress: params.shippingAddress,
        productName: params.productName,
        total: params.total,
        customerPhoneLast4: params.last4,
      }),
      isTest: params.isTest,
      retentionExpiresAt: retentionDate(params.merchant.dataRetentionMonths),
    })
    .returning({ id: orders.id });

  // Art. 23 — Audit log (obligatoire)
  await db.insert(auditLogs).values({
    merchantId: params.merchantId,
    actor: "system",
    action: "score",
    targetType: "order",
    targetId: String(insertedOrder.id),
    details: JSON.stringify({
      score: scored.scoringResult.score,
      decision: scored.decision,
      riskLevel: scored.scoringResult.riskLevel,
      version: scored.scoringResult.version,
      confidence: scored.scoringResult.confidence,
    }),
  });

  // Execute pipeline (escalation deadlines)
  let parsedEscalationConfig = null;
  if (params.merchant.escalationConfig) {
    try { parsedEscalationConfig = JSON.parse(params.merchant.escalationConfig); } catch { /* use default */ }
  }

  const pipelineResult = executePipeline({
    score: scored.scoringResult.score,
    decision: scored.decision,
    total: params.total,
    merchantSettings: {
      verifyThreshold: params.merchant.verifyThreshold,
      flagThreshold: params.merchant.flagThreshold,
      blockThreshold: params.merchant.blockThreshold,
      autoBlockEnabled: params.merchant.autoBlockEnabled,
      escalationConfig: parsedEscalationConfig,
    },
    orderRef: params.ref,
    customerName: params.customerName,
  });

  // Update order with pipeline status
  await db
    .update(orders)
    .set({
      pipelineStatus: pipelineResult.status,
      pipelineProcessedAt: now,
      reviewDeadline: pipelineResult.reviewDeadline,
      escalationPriority: pipelineResult.escalationPriority,
      merchantNotifiedAt: now,
    })
    .where(eq(orders.id, insertedOrder.id));

  // Notification (skip test orders)
  if (!params.isTest && await shouldNotify(params.merchantId, pipelineResult.notificationType)) {
    await db.insert(notifications).values({
      merchantId: params.merchantId,
      orderId: insertedOrder.id,
      type: pipelineResult.notificationType,
      title: pipelineResult.title,
      message: pipelineResult.message,
      severity: pipelineResult.severity,
      actionUrl: `/dashboard/orders?selected=${insertedOrder.id}`,
    });
  }

  // Pipeline audit log (Art. 23)
  await db.insert(auditLogs).values({
    merchantId: params.merchantId,
    actor: "system",
    action: "pipeline_executed",
    targetType: "order",
    targetId: String(insertedOrder.id),
    details: JSON.stringify({
      pipelineStatus: pipelineResult.status,
      severity: pipelineResult.severity,
      reviewDeadline: pipelineResult.reviewDeadline?.toISOString() ?? null,
    }),
  });

  // If auto_blocked, ensure decision is block
  let finalDecision = scored.decision;
  if (pipelineResult.status === "auto_blocked") {
    await db
      .update(orders)
      .set({ decision: "block" })
      .where(eq(orders.id, insertedOrder.id));
    finalDecision = "block";
  }

  return { orderId: insertedOrder.id, pipelineResult, finalDecision };
}
