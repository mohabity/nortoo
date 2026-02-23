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
import { customers, orders, auditLogs, oppositionList, notifications, merchants } from "@/db/schema";
import { and, eq, or, isNull, gt, sql } from "drizzle-orm";
import { hashPhone, phoneLast4 } from "@/lib/hash";
import { scoreOrder, type ScoringResult, type VelocityData } from "@/lib/scoring";
import { executePipeline } from "@/lib/pipeline";
import { checkQuota, recordUsage, QuotaExceededError } from "@/lib/quota";
import { normalizeProductId, updateProductStats, getProductRtoRate } from "@/lib/product-stats";
import { normalizeCity, updateCityStats, getCityRiskData, getGlobalCityStats } from "@/lib/city-stats";
import { parseAddress } from "@/lib/address-parser";
import { updateZoneStats, getZoneStats, getGlobalZoneStats } from "@/lib/zone-stats";
import { generateExplanation } from "@/lib/score-explanation";
import { buildSearchIndex } from "@/lib/search";

export interface IngestParams {
  merchantId: number;
  merchant: {
    verifyThreshold: number;
    flagThreshold: number;
    blockThreshold: number;
    autoBlockEnabled: boolean;
    escalationConfig?: string | null;
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
  productId?: string;
  productCategory?: string;
  productPrice?: number;
  quantity?: number;
  shippingCity?: string;
  shippingAddress?: string;
  orderHour: number;
  isTest?: boolean;
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
  isTest: boolean;
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
    productId: rawProductId,
    productCategory,
    productPrice,
    quantity,
    shippingCity,
    shippingAddress,
    orderHour,
  } = params;

  // ── 0. Quota check — block if trial expired or quota exceeded ──
  if (!params.isTest) {
    const quota = await checkQuota(merchantId);
    if (!quota.allowed) {
      throw new QuotaExceededError(quota.reason, quota);
    }
  }

  // Resolve product ID: use external ID if available, otherwise slugify name
  const resolvedProductId = rawProductId
    ? rawProductId
    : productName
      ? normalizeProductId(productName)
      : undefined;

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
        scoringVersion: "v1.1",
        pipelineStatus: "needs_review",
        pipelineProcessedAt: now,
        merchantNotifiedAt: now,
        isTest: params.isTest ?? false,
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

    if (!params.isTest) {
      await db.insert(notifications).values({
        merchantId,
        orderId: insertedOrder.id,
        type: "order_flagged",
        title: `Commande ${ref} — opposition active`,
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
      isTest: params.isTest ?? false,
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
    // Update last seen + increment total orders (skip for test orders)
    await db
      .update(customers)
      .set({
        lastSeen: new Date(),
        totalOrders: params.isTest ? existingCustomer.totalOrders : existingCustomer.totalOrders + 1,
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
        totalOrders: params.isTest ? 0 : 1,
        successfulOrders: 0,
        failedOrders: 0,
        retentionExpiresAt: retentionDate(merchant.dataRetentionMonths),
      })
      .returning({ id: customers.id });
    customerId = inserted.id;
    customerHistory = undefined; // New customer
  }

  // ── 3b. Lookup product stats for scoring ──
  let productRtoRate: number | undefined;
  let productTotalOrders: number | undefined;
  if (resolvedProductId) {
    try {
      const productData = await getProductRtoRate(merchantId, resolvedProductId);
      if (productData) {
        productRtoRate = productData.rtoRate;
        productTotalOrders = productData.totalOrders;
      }
    } catch (err) {
      console.error("[Ingest] Product stats lookup failed (non-blocking):", err);
    }
  }

  // ── 3c. Lookup city stats for scoring ──
  let cityRtoRate: number | undefined;
  let cityRiskTier: string | undefined;
  let cityTotalOrders: number | undefined;
  if (shippingCity) {
    try {
      const normalized = normalizeCity(shippingCity);
      const cityData = await getCityRiskData(merchantId, normalized);
      if (cityData) {
        cityRtoRate = cityData.rtoRate;
        cityRiskTier = cityData.riskTier;
        cityTotalOrders = cityData.totalOrders;
      }
      // Fallback to global stats if merchant has insufficient data
      if (!cityData || cityData.totalOrders < 10) {
        const globalData = await getGlobalCityStats(normalized);
        if (globalData && (!cityData || globalData.totalOrders > cityData.totalOrders)) {
          cityRtoRate = globalData.rtoRate;
          cityTotalOrders = globalData.totalOrders;
          // Compute tier from global data
          if (globalData.totalOrders < 5) cityRiskTier = "unknown";
          else if (globalData.rtoRate > 0.40) cityRiskTier = "dangerous";
          else if (globalData.rtoRate > 0.25) cityRiskTier = "risky";
          else if (globalData.rtoRate > 0.15) cityRiskTier = "moderate";
          else cityRiskTier = "safe";
        }
      }
    } catch (err) {
      console.error("[Ingest] City stats lookup failed (non-blocking):", err);
    }
  }

  // ── 3d. Parse address for zone-level data ──
  let parsedCity: string | null = null;
  let parsedZone: string | null = null;
  let parsedPostalCode: string | null = null;
  let addressConfidence: number | null = null;
  let zoneRtoRate: number | undefined;
  let zoneTotalOrders: number | undefined;
  let zoneDataSource: "merchant" | "network" | "static" | undefined;

  if (shippingAddress) {
    try {
      const parsed = parseAddress(shippingAddress);
      parsedCity = parsed.city;
      parsedZone = parsed.zone;
      parsedPostalCode = parsed.postalCode;
      addressConfidence = parsed.confidence;

      if (parsedZone && parsedCity) {
        // Try merchant-level zone stats first
        const merchantZone = await getZoneStats(merchantId, parsedCity, parsedZone);
        if (merchantZone && merchantZone.totalOrders >= 5) {
          zoneRtoRate = merchantZone.rtoRate;
          zoneTotalOrders = merchantZone.totalOrders;
          zoneDataSource = "merchant";
        }
        // Fallback to global (cross-merchant) zone stats
        if (!merchantZone || merchantZone.totalOrders < 10) {
          const globalZone = await getGlobalZoneStats(parsedCity, parsedZone);
          if (globalZone && (!merchantZone || globalZone.totalOrders > merchantZone.totalOrders)) {
            zoneRtoRate = globalZone.rtoRate;
            zoneTotalOrders = globalZone.totalOrders;
            zoneDataSource = "network";
          }
        }
      }
    } catch (err) {
      console.error("[Ingest] Address parsing / zone lookup failed (non-blocking):", err);
    }
  }

  // ── 3e. Velocity pre-calculation (v2) ──
  let velocity: VelocityData | undefined;
  if (customerId) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Query 1: Order counts + cumulative amount by time window
      const [velocityStats] = await db
        .select({
          ordersLast1h: sql<number>`COUNT(*) FILTER (WHERE ${orders.createdAt} >= ${oneHourAgo})`,
          ordersLast24h: sql<number>`COUNT(*) FILTER (WHERE ${orders.createdAt} >= ${twentyFourHoursAgo})`,
          totalAmountLast24h: sql<number>`COALESCE(SUM(${orders.total}) FILTER (WHERE ${orders.createdAt} >= ${twentyFourHoursAgo}), 0)`,
          ordersLast7d: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.customerId, customerId),
            gt(orders.createdAt, sevenDaysAgo),
            eq(orders.isTest, false)
          )
        );

      // Query 2: Distinct addresses in last 24h
      const [addrStats] = await db
        .select({
          distinctAddresses: sql<number>`COUNT(DISTINCT ${orders.shippingAddress})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.customerId, customerId),
            gt(orders.createdAt, twentyFourHoursAgo),
            eq(orders.isTest, false)
          )
        );

      velocity = {
        ordersLast1h: Number(velocityStats?.ordersLast1h ?? 0),
        ordersLast24h: Number(velocityStats?.ordersLast24h ?? 0),
        totalAmountLast24h: Number(velocityStats?.totalAmountLast24h ?? 0),
        ordersLast7d: Number(velocityStats?.ordersLast7d ?? 0),
        distinctAddressesLast24h: Number(addrStats?.distinctAddresses ?? 0),
      };
    } catch (err) {
      console.error("[Ingest] Velocity calculation failed (non-blocking):", err);
    }
  }

  // ── 4. Score order (v2 — 24 rules, 8 categories) ──
  const orderDate = new Date();
  const scoringResult: ScoringResult = scoreOrder(
    {
      total,
      city: shippingCity,
      address: shippingAddress,
      hour: orderHour,
      dayOfWeek: orderDate.getDay(),
      customerName,
      quantity,
      customer: customerHistory,
      velocity,
      productRtoRate,
      productTotalOrders,
      cityRtoRate,
      cityRiskTier,
      cityTotalOrders,
      zoneRtoRate,
      zoneTotalOrders,
      zoneDataSource,
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

  // ── 5a. No shipping address → mandatory verification ──
  if (!shippingAddress || shippingAddress.trim().length === 0) {
    if (decision === "ship") {
      decision = "verify";
    }
    scoringResult.factors.push({
      rule: "R_NO_ADDRESS",
      points: 0,
      reason: "Adresse de livraison manquante — vérification obligatoire",
      category: "address",
    });
  }

  // ── 5b. Generate human-readable explanation ──
  const explanation = generateExplanation(
    scoringResult.score,
    decision,
    scoringResult.factors,
    scoringResult.confidence
  );

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
      productId: resolvedProductId,
      productCategory,
      productPrice,
      quantity,
      total,
      currency,
      shippingCity,
      shippingAddress,
      parsedCity,
      parsedZone,
      parsedPostalCode,
      addressConfidence,
      fraudScore: scoringResult.score,
      riskLevel: scoringResult.riskLevel,
      decision,
      scoringFactors: JSON.stringify(scoringResult.factors),
      scoreExplanation: JSON.stringify(explanation),
      scoringVersion: scoringResult.version,
      searchIndex: buildSearchIndex({
        externalRef: ref,
        customerName,
        shippingCity,
        parsedZone,
        shippingAddress,
        productName,
        total,
        customerPhoneLast4: last4,
      }),
      isTest: params.isTest ?? false,
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

  // ── 6b. Execute pipeline (with dynamic escalation deadlines) ──
  let parsedEscalationConfig = null;
  if (merchant.escalationConfig) {
    try { parsedEscalationConfig = JSON.parse(merchant.escalationConfig); } catch { /* use default */ }
  }

  const pipelineResult = executePipeline({
    score: scoringResult.score,
    decision,
    total,
    merchantSettings: {
      verifyThreshold: merchant.verifyThreshold,
      flagThreshold: merchant.flagThreshold,
      blockThreshold: merchant.blockThreshold,
      autoBlockEnabled: merchant.autoBlockEnabled,
      escalationConfig: parsedEscalationConfig,
    },
    orderRef: ref,
    customerName,
  });

  const now = new Date();

  // ── 6c. Update order with pipeline status + escalation priority ──
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

  // ── 6d. Insert notification (skip for test orders) ──
  if (!params.isTest) {
    await db.insert(notifications).values({
      merchantId,
      orderId: insertedOrder.id,
      type: pipelineResult.notificationType,
      title: pipelineResult.title,
      message: pipelineResult.message,
      severity: pipelineResult.severity,
      actionUrl: `/dashboard/orders?selected=${insertedOrder.id}`,
    });
  }

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

  // ── 7. Increment monthly order counter (atomic, skip test orders) ──
  if (!params.isTest) {
    try {
      await db
        .update(merchants)
        .set({
          currentMonthOrders: sql`${merchants.currentMonthOrders} + 1`,
        })
        .where(eq(merchants.id, merchantId));
    } catch (err) {
      console.error("[Ingest] Monthly order counter increment failed (non-blocking):", err);
    }

    // Record usage in monthly usage logs (billing history)
    try {
      await recordUsage(merchantId, decision, total);
    } catch (err) {
      console.error("[Ingest] Usage recording failed (non-blocking):", err);
    }
  }

  // ── 8. Update product & city stats (fire-and-forget, non-blocking, skip for test orders) ──
  if (!params.isTest) {
    try {
      if (resolvedProductId && productName) {
        await updateProductStats({
          merchantId,
          productId: resolvedProductId,
          productName,
          productCategory,
          orderTotal: total,
        });
      }
    } catch (err) {
      console.error("[Ingest] Product stats update failed (non-blocking):", err);
    }

    try {
      if (shippingCity) {
        await updateCityStats({
          merchantId,
          city: shippingCity,
          orderScore: scoringResult.score,
          orderTotal: total,
        });
      }
    } catch (err) {
      console.error("[Ingest] City stats update failed (non-blocking):", err);
    }

    try {
      if (parsedZone && parsedCity) {
        await updateZoneStats({
          merchantId,
          city: parsedCity,
          zone: parsedZone,
          postalCode: parsedPostalCode ?? undefined,
          orderScore: scoringResult.score,
        });
      }
    } catch (err) {
      console.error("[Ingest] Zone stats update failed (non-blocking):", err);
    }
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
    isTest: params.isTest ?? false,
  };
}

/** Calculate retention expiry date from now + months */
function retentionDate(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
