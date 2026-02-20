/**
 * Shared order ingestion pipeline.
 * Used by both /api/webhook/youcan and /api/webhook/ingest.
 *
 * Pipeline:
 * 1. Hash phone (never store raw — Art. 23)
 * 2. Check opposition list (Art. 9)
 * 3. Upsert customer
 * 4. Score order
 * 5. Apply auto-block override
 * 6. Insert order + audit log (Art. 23)
 * 7. Return result
 */

import { db } from "@/db/index";
import { customers, orders, auditLogs, oppositionList, notifications } from "@/db/schema";
import { and, eq, or, isNull } from "drizzle-orm";
import { hashPhone, phoneLast4 } from "@/lib/hash";
import { scoreOrder, type ScoringResult } from "@/lib/scoring";
import { executePipeline } from "@/lib/pipeline";

export interface IngestParams {
  merchantId: number;
  merchant: {
    verifyThreshold: number;
    flagThreshold: number;
    blockThreshold: number;
    autoBlockEnabled: boolean;
    dataRetentionMonths: number;
  };
  // Raw phone — will be hashed immediately
  phone: string;
  customerName?: string;
  customerCity?: string;
  // Order data
  ref: string;
  externalId?: string;
  total: number;
  currency?: string;
  productName?: string;
  shippingCity?: string;
  shippingAddress?: string;
  orderHour: number;
}

export interface IngestResult {
  orderId: number;
  score: number;
  decision: string;
  riskLevel: string;
  factors: { rule: string; points: number; reason: string }[];
  confidence: number;
  opposed: boolean;
  pipelineStatus: string;
  reviewDeadline: string | null;
}

export async function processIncomingOrder(params: IngestParams): Promise<IngestResult> {
  const {
    merchantId,
    merchant,
    phone,
    customerName,
    customerCity,
    ref,
    externalId,
    total,
    currency = "MAD",
    productName,
    shippingCity,
    shippingAddress,
    orderHour,
  } = params;

  // ── 1. Hash phone immediately — NEVER store raw (Art. 23) ──
  const phoneHash = hashPhone(phone);
  const last4 = phoneLast4(phone);

  // ── 2. Check opposition list (Art. 9) ──
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

  if (opposition) {
    // Consumer has opposed — scoring disabled, flag for manual review
    const now = new Date();
    const [insertedOrder] = await db
      .insert(orders)
      .values({
        merchantId,
        externalId,
        externalRef: ref,
        customerName,
        customerPhoneLast4: last4,
        productName,
        total,
        currency,
        shippingCity,
        shippingAddress,
        fraudScore: 25,
        riskLevel: "low",
        decision: "flag",
        scoringFactors: JSON.stringify([{ rule: "OPPOSITION", points: 0, reason: "Consommateur opposé (Art. 9) — scoring désactivé" }]),
        scoringVersion: "v1.0",
        pipelineStatus: "needs_review",
        pipelineProcessedAt: now,
        merchantNotifiedAt: now,
        retentionExpiresAt: retentionDate(merchant.dataRetentionMonths),
      })
      .returning({ id: orders.id });

    await db.insert(auditLogs).values({
      merchantId,
      actor: "system",
      action: "score",
      targetType: "order",
      targetId: String(insertedOrder.id),
      details: JSON.stringify({ score: 25, decision: "flag", reason: "opposition_active" }),
    });

    await db.insert(notifications).values({
      merchantId,
      orderId: insertedOrder.id,
      type: "order_flagged",
      title: `Commande ${ref} — opposition active`,
      message: `Consommateur opposé (Art. 9). Scoring désactivé, vérification manuelle requise.`,
      severity: "warning",
      actionUrl: `/dashboard/orders?selected=${insertedOrder.id}`,
    });

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
    };
  }

  // ── 3. Upsert customer by (merchantId, phoneHash) ──
  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.merchantId, merchantId), eq(customers.phoneHash, phoneHash)))
    .limit(1);

  let customerId: number;
  let customerHistory: { totalOrders: number; successfulOrders: number; failedOrders: number } | undefined;

  if (existingCustomer) {
    customerId = existingCustomer.id;
    customerHistory = {
      totalOrders: existingCustomer.totalOrders,
      successfulOrders: existingCustomer.successfulOrders,
      failedOrders: existingCustomer.failedOrders,
    };
    // Update last seen + increment total orders
    await db
      .update(customers)
      .set({
        lastSeen: new Date(),
        totalOrders: existingCustomer.totalOrders + 1,
        name: customerName ?? existingCustomer.name,
        city: customerCity ?? existingCustomer.city,
        retentionExpiresAt: retentionDate(merchant.dataRetentionMonths),
      })
      .where(eq(customers.id, customerId));
  } else {
    const [inserted] = await db
      .insert(customers)
      .values({
        merchantId,
        phoneHash,
        phoneLast4: last4,
        name: customerName,
        city: customerCity,
        totalOrders: 1,
        successfulOrders: 0,
        failedOrders: 0,
        retentionExpiresAt: retentionDate(merchant.dataRetentionMonths),
      })
      .returning({ id: customers.id });
    customerId = inserted.id;
    customerHistory = undefined; // New customer
  }

  // ── 4. Score order ──
  const scoringResult: ScoringResult = scoreOrder(
    {
      total,
      city: shippingCity,
      address: shippingAddress,
      hour: orderHour,
      customer: customerHistory,
    },
    {
      verify: merchant.verifyThreshold,
      flag: merchant.flagThreshold,
      block: merchant.blockThreshold,
    }
  );

  // ── 5. Apply auto-block override ──
  let decision = scoringResult.decision;
  if (!merchant.autoBlockEnabled && decision === "block") {
    decision = "flag"; // Downgrade to flag when auto-block is disabled
  }

  // ── 6. Insert order + audit log ──
  const [insertedOrder] = await db
    .insert(orders)
    .values({
      merchantId,
      customerId,
      externalId,
      externalRef: ref,
      customerName,
      customerPhoneLast4: last4,
      productName,
      total,
      currency,
      shippingCity,
      shippingAddress,
      fraudScore: scoringResult.score,
      riskLevel: scoringResult.riskLevel,
      decision,
      scoringFactors: JSON.stringify(scoringResult.factors),
      scoringVersion: scoringResult.version,
      retentionExpiresAt: retentionDate(merchant.dataRetentionMonths),
    })
    .returning({ id: orders.id });

  // Art. 23 — Audit log (obligatoire)
  await db.insert(auditLogs).values({
    merchantId,
    actor: "system",
    action: "score",
    targetType: "order",
    targetId: String(insertedOrder.id),
    details: JSON.stringify({
      score: scoringResult.score,
      decision,
      riskLevel: scoringResult.riskLevel,
      version: scoringResult.version,
      confidence: scoringResult.confidence,
    }),
  });

  // ── 6b. Execute pipeline ──
  const pipelineResult = executePipeline({
    score: scoringResult.score,
    decision,
    merchantSettings: {
      verifyThreshold: merchant.verifyThreshold,
      flagThreshold: merchant.flagThreshold,
      blockThreshold: merchant.blockThreshold,
      autoBlockEnabled: merchant.autoBlockEnabled,
    },
    orderRef: ref,
    customerName,
  });

  const now = new Date();

  // ── 6c. Update order with pipeline status ──
  await db
    .update(orders)
    .set({
      pipelineStatus: pipelineResult.status,
      pipelineProcessedAt: now,
      reviewDeadline: pipelineResult.reviewDeadline,
      merchantNotifiedAt: now,
    })
    .where(eq(orders.id, insertedOrder.id));

  // ── 6d. Insert notification ──
  await db.insert(notifications).values({
    merchantId,
    orderId: insertedOrder.id,
    type: pipelineResult.notificationType,
    title: pipelineResult.title,
    message: pipelineResult.message,
    severity: pipelineResult.severity,
    actionUrl: `/dashboard/orders?selected=${insertedOrder.id}`,
  });

  // ── 6e. Pipeline audit log (Art. 23) ──
  await db.insert(auditLogs).values({
    merchantId,
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

  // ── 6f. If auto_blocked, ensure decision is block ──
  if (pipelineResult.status === "auto_blocked") {
    await db
      .update(orders)
      .set({ decision: "block" })
      .where(eq(orders.id, insertedOrder.id));
    decision = "block";
  }

  return {
    orderId: insertedOrder.id,
    score: scoringResult.score,
    decision,
    riskLevel: scoringResult.riskLevel,
    factors: scoringResult.factors,
    confidence: scoringResult.confidence,
    opposed: false,
    pipelineStatus: pipelineResult.status,
    reviewDeadline: pipelineResult.reviewDeadline?.toISOString() ?? null,
  };
}

/** Calculate retention expiry date from now + months */
function retentionDate(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
