/**
 * Shared order ingestion pipeline.
 * Used by both /api/webhook/youcan and /api/webhook/ingest.
 *
 * Pipeline:
 * 1. Hash phone (never store raw — Art. 23)
 * 2. Check opposition list (Art. 9)
 * 3. Upsert customer + gather scoring data
 * 4. Score order + apply overrides
 * 5. Save order + audit log (Art. 23)
 * 6. Record metrics (non-blocking)
 * 7. Return result
 */

import { db } from "@/db/index";
import { customers, orders, auditLogs, oppositionList, notifications, merchants, phoneList } from "@/db/schema";
import { and, eq, or, isNull, gt, sql } from "drizzle-orm";
import { hashPhone, phoneLast4 } from "@/lib/hash";
import { scoreOrder, type ScoringResult, type VelocityData } from "@/lib/scoring";
import { executePipeline } from "@/lib/pipeline";
import { checkQuota, recordUsage, QuotaExceededError } from "@/lib/quota";
import { shouldNotify } from "@/lib/notification-helper";
import { normalizeProductId, updateProductStats, getProductRtoRate } from "@/lib/product-stats";
import { normalizeCity, updateCityStats, getCityRiskData, getGlobalCityStats } from "@/lib/city-stats";
import { parseAddress } from "@/lib/address-parser";
import { updateZoneStats, getZoneStats, getGlobalZoneStats } from "@/lib/zone-stats";
import { generateExplanation } from "@/lib/score-explanation";
import { buildSearchIndex } from "@/lib/search";

// ═══════════════════════════════════════════════════════════
// Public types
// ═══════════════════════════════════════════════════════════

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
  phone: string;
  customerName?: string;
  customerCity?: string;
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

// ═══════════════════════════════════════════════════════════
// Internal types (used between sub-functions)
// ═══════════════════════════════════════════════════════════

interface PhoneListOverride {
  decision: "ship" | "block";
  reason: string;
}

interface CustomerData {
  customerId: number;
  customerHistory?: { totalOrders: number; successfulOrders: number; failedOrders: number };
}

interface GeoData {
  productRtoRate?: number;
  productTotalOrders?: number;
  cityRtoRate?: number;
  cityRiskTier?: string;
  cityTotalOrders?: number;
  parsedCity: string | null;
  parsedZone: string | null;
  parsedPostalCode: string | null;
  addressConfidence: number | null;
  zoneRtoRate?: number;
  zoneTotalOrders?: number;
  zoneDataSource?: "merchant" | "network" | "static";
}

interface ScoredOrder {
  scoringResult: ScoringResult;
  decision: string;
  explanation: ReturnType<typeof generateExplanation>;
}

// ═══════════════════════════════════════════════════════════
// Main entry point
// ═══════════════════════════════════════════════════════════

export async function processIncomingOrder(params: IngestParams): Promise<IngestResult> {
  const {
    merchantId, merchant, phone, customerName, customerCity,
    ref, externalId, total, currency = "MAD",
    productName, productId: rawProductId, productCategory, productPrice,
    quantity, shippingCity, shippingAddress, orderHour,
  } = params;

  // ── 0. Quota check ──
  if (!params.isTest) {
    const quota = await checkQuota(merchantId);
    if (!quota.allowed) {
      throw new QuotaExceededError(quota.reason, quota);
    }
  }

  const resolvedProductId = rawProductId
    ? rawProductId
    : productName ? normalizeProductId(productName) : undefined;

  // ── 1. Hash phone — NEVER store raw (Art. 23) ──
  const phoneHash = hashPhone(phone);
  const last4 = phoneLast4(phone);

  // ── 2. Check phone list + opposition ──
  const phoneListOverride = await lookupPhoneList(merchantId, phoneHash);
  const opposition = await checkOpposition(merchantId, phoneHash);

  if (opposition) {
    return handleOpposedOrder({
      merchantId, merchant, ref, externalId, customerName, last4,
      productName, total, currency, shippingCity, shippingAddress,
      isTest: params.isTest ?? false,
    });
  }

  // ── 3. Gather all scoring data ──
  const { customerId, customerHistory } = await upsertCustomer({
    merchantId, phoneHash, last4, customerName, customerCity,
    isTest: params.isTest ?? false, retentionMonths: merchant.dataRetentionMonths,
  });

  const geoData = await gatherGeoData(merchantId, resolvedProductId, shippingCity, shippingAddress);

  const velocity = await computeVelocity(merchantId, customerId);

  // ── 4. Score + apply overrides ──
  const scored = applyScoring({
    total, shippingCity, shippingAddress, orderHour, customerName, quantity,
    customerHistory, velocity, merchant, phoneListOverride, geoData,
  });

  // ── 5. Save order + execute pipeline ──
  const { orderId, pipelineResult, finalDecision } = await saveOrder({
    merchantId, customerId, externalId, ref, customerName, last4,
    productName, resolvedProductId, productCategory, productPrice, quantity,
    total, currency, shippingCity, shippingAddress, geoData,
    scored, phoneListOverride, merchant, isTest: params.isTest ?? false,
  });

  // ── 6. Record metrics (non-blocking, skip test orders) ──
  if (!params.isTest) {
    await recordMetrics({
      merchantId, finalDecision, total, resolvedProductId, productName,
      productCategory, shippingCity, scoringResult: scored.scoringResult,
      parsedCity: geoData.parsedCity, parsedZone: geoData.parsedZone,
      parsedPostalCode: geoData.parsedPostalCode,
    });
  }

  return {
    orderId,
    score: scored.scoringResult.score,
    decision: finalDecision,
    riskLevel: scored.scoringResult.riskLevel,
    factors: scored.scoringResult.factors,
    confidence: scored.scoringResult.confidence,
    opposed: false,
    pipelineStatus: pipelineResult.status,
    reviewDeadline: pipelineResult.reviewDeadline?.toISOString() ?? null,
    isTest: params.isTest ?? false,
  };
}

// ═══════════════════════════════════════════════════════════
// Sub-functions
// ═══════════════════════════════════════════════════════════

/** Check if phone is on merchant blacklist/whitelist */
async function lookupPhoneList(
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
async function checkOpposition(merchantId: number, phoneHash: string): Promise<boolean> {
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
async function handleOpposedOrder(params: {
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

/** Upsert customer by (merchantId, phoneHash) */
async function upsertCustomer(params: {
  merchantId: number;
  phoneHash: string;
  last4: string;
  customerName?: string;
  customerCity?: string;
  isTest: boolean;
  retentionMonths: number;
}): Promise<CustomerData> {
  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.merchantId, params.merchantId), eq(customers.phoneHash, params.phoneHash)))
    .limit(1);

  if (existing) {
    await db
      .update(customers)
      .set({
        lastSeen: new Date(),
        totalOrders: params.isTest ? existing.totalOrders : existing.totalOrders + 1,
        name: params.customerName ?? existing.name,
        city: params.customerCity ?? existing.city,
        retentionExpiresAt: retentionDate(params.retentionMonths),
      })
      .where(eq(customers.id, existing.id));

    return {
      customerId: existing.id,
      customerHistory: {
        totalOrders: existing.totalOrders,
        successfulOrders: existing.successfulOrders,
        failedOrders: existing.failedOrders,
      },
    };
  }

  const [inserted] = await db
    .insert(customers)
    .values({
      merchantId: params.merchantId,
      phoneHash: params.phoneHash,
      phoneLast4: params.last4,
      name: params.customerName,
      city: params.customerCity,
      totalOrders: params.isTest ? 0 : 1,
      successfulOrders: 0,
      failedOrders: 0,
      retentionExpiresAt: retentionDate(params.retentionMonths),
    })
    .returning({ id: customers.id });

  return { customerId: inserted.id };
}

/** Gather product, city, and zone risk data for scoring */
async function gatherGeoData(
  merchantId: number,
  resolvedProductId: string | undefined,
  shippingCity: string | undefined,
  shippingAddress: string | undefined,
): Promise<GeoData> {
  const result: GeoData = {
    parsedCity: null,
    parsedZone: null,
    parsedPostalCode: null,
    addressConfidence: null,
  };

  // Product stats
  if (resolvedProductId) {
    try {
      const productData = await getProductRtoRate(merchantId, resolvedProductId);
      if (productData) {
        result.productRtoRate = productData.rtoRate;
        result.productTotalOrders = productData.totalOrders;
      }
    } catch (err) {
      console.error("[Ingest] Product stats lookup failed (non-blocking):", err);
    }
  }

  // City stats
  if (shippingCity) {
    try {
      const normalized = normalizeCity(shippingCity);
      const cityData = await getCityRiskData(merchantId, normalized);
      if (cityData) {
        result.cityRtoRate = cityData.rtoRate;
        result.cityRiskTier = cityData.riskTier;
        result.cityTotalOrders = cityData.totalOrders;
      }
      // Fallback to global stats if merchant has insufficient data
      if (!cityData || cityData.totalOrders < 10) {
        const globalData = await getGlobalCityStats(normalized);
        if (globalData && (!cityData || globalData.totalOrders > cityData.totalOrders)) {
          result.cityRtoRate = globalData.rtoRate;
          result.cityTotalOrders = globalData.totalOrders;
          if (globalData.totalOrders < 5) result.cityRiskTier = "unknown";
          else if (globalData.rtoRate > 0.40) result.cityRiskTier = "dangerous";
          else if (globalData.rtoRate > 0.25) result.cityRiskTier = "risky";
          else if (globalData.rtoRate > 0.15) result.cityRiskTier = "moderate";
          else result.cityRiskTier = "safe";
        }
      }
    } catch (err) {
      console.error("[Ingest] City stats lookup failed (non-blocking):", err);
    }
  }

  // Address parsing + zone stats
  if (shippingAddress) {
    try {
      const parsed = parseAddress(shippingAddress);
      result.parsedCity = parsed.city;
      result.parsedZone = parsed.zone;
      result.parsedPostalCode = parsed.postalCode;
      result.addressConfidence = parsed.confidence;

      if (parsed.zone && parsed.city) {
        const merchantZone = await getZoneStats(merchantId, parsed.city, parsed.zone);
        if (merchantZone && merchantZone.totalOrders >= 5) {
          result.zoneRtoRate = merchantZone.rtoRate;
          result.zoneTotalOrders = merchantZone.totalOrders;
          result.zoneDataSource = "merchant";
        }
        if (!merchantZone || merchantZone.totalOrders < 10) {
          const globalZone = await getGlobalZoneStats(parsed.city, parsed.zone);
          if (globalZone && (!merchantZone || globalZone.totalOrders > merchantZone.totalOrders)) {
            result.zoneRtoRate = globalZone.rtoRate;
            result.zoneTotalOrders = globalZone.totalOrders;
            result.zoneDataSource = "network";
          }
        }
      }
    } catch (err) {
      console.error("[Ingest] Address parsing / zone lookup failed (non-blocking):", err);
    }
  }

  return result;
}

/** Compute velocity data for a customer (order frequency, amounts, addresses) */
async function computeVelocity(
  merchantId: number,
  customerId: number,
): Promise<VelocityData | undefined> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

    return {
      ordersLast1h: Number(velocityStats?.ordersLast1h ?? 0),
      ordersLast24h: Number(velocityStats?.ordersLast24h ?? 0),
      totalAmountLast24h: Number(velocityStats?.totalAmountLast24h ?? 0),
      ordersLast7d: Number(velocityStats?.ordersLast7d ?? 0),
      distinctAddressesLast24h: Number(addrStats?.distinctAddresses ?? 0),
    };
  } catch (err) {
    console.error("[Ingest] Velocity calculation failed (non-blocking):", err);
    return undefined;
  }
}

/** Run scoring engine + apply auto-block, no-address, and phone list overrides */
function applyScoring(params: {
  total: number;
  shippingCity?: string;
  shippingAddress?: string;
  orderHour: number;
  customerName?: string;
  quantity?: number;
  customerHistory?: { totalOrders: number; successfulOrders: number; failedOrders: number };
  velocity?: VelocityData;
  merchant: { verifyThreshold: number; flagThreshold: number; blockThreshold: number; autoBlockEnabled: boolean };
  phoneListOverride: PhoneListOverride | null;
  geoData: GeoData;
}): ScoredOrder {
  const orderDate = new Date();
  const scoringResult = scoreOrder(
    {
      total: params.total,
      city: params.shippingCity,
      address: params.shippingAddress,
      hour: params.orderHour,
      dayOfWeek: orderDate.getDay(),
      customerName: params.customerName,
      quantity: params.quantity,
      customer: params.customerHistory,
      velocity: params.velocity,
      productRtoRate: params.geoData.productRtoRate,
      productTotalOrders: params.geoData.productTotalOrders,
      cityRtoRate: params.geoData.cityRtoRate,
      cityRiskTier: params.geoData.cityRiskTier,
      cityTotalOrders: params.geoData.cityTotalOrders,
      zoneRtoRate: params.geoData.zoneRtoRate,
      zoneTotalOrders: params.geoData.zoneTotalOrders,
      zoneDataSource: params.geoData.zoneDataSource,
    },
    {
      verify: params.merchant.verifyThreshold,
      flag: params.merchant.flagThreshold,
      block: params.merchant.blockThreshold,
    }
  );

  // Apply overrides
  let decision = scoringResult.decision;

  if (!params.merchant.autoBlockEnabled && decision === "block") {
    decision = "flag";
  }

  if (!params.shippingAddress || params.shippingAddress.trim().length === 0) {
    if (decision === "ship") decision = "verify";
    scoringResult.factors.push({
      rule: "R_NO_ADDRESS",
      points: 0,
      reason: "Adresse de livraison manquante — vérification obligatoire",
      category: "address",
    });
  }

  if (params.phoneListOverride) {
    decision = params.phoneListOverride.decision;
    scoringResult.factors.push({
      rule: "R_PHONELIST",
      points: 0,
      reason: params.phoneListOverride.reason,
      category: "override",
    });
  }

  const explanation = generateExplanation(
    scoringResult.score,
    decision,
    scoringResult.factors,
    scoringResult.confidence
  );

  return { scoringResult, decision, explanation };
}

/** Insert order + audit logs + execute pipeline + notifications */
async function saveOrder(params: {
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

/** Record usage counters + product/city/zone stats (all non-blocking) */
async function recordMetrics(params: {
  merchantId: number;
  finalDecision: string;
  total: number;
  resolvedProductId?: string;
  productName?: string;
  productCategory?: string;
  shippingCity?: string;
  scoringResult: ScoringResult;
  parsedCity: string | null;
  parsedZone: string | null;
  parsedPostalCode: string | null;
}): Promise<void> {
  // Increment monthly order counter
  try {
    await db
      .update(merchants)
      .set({ currentMonthOrders: sql`${merchants.currentMonthOrders} + 1` })
      .where(eq(merchants.id, params.merchantId));
  } catch (err) {
    console.error("[Ingest] Monthly order counter increment failed (non-blocking):", err);
  }

  // Record usage in billing history
  try {
    await recordUsage(params.merchantId, params.finalDecision, params.total);
  } catch (err) {
    console.error("[Ingest] Usage recording failed (non-blocking):", err);
  }

  // Product stats
  try {
    if (params.resolvedProductId && params.productName) {
      await updateProductStats({
        merchantId: params.merchantId,
        productId: params.resolvedProductId,
        productName: params.productName,
        productCategory: params.productCategory,
        orderTotal: params.total,
      });
    }
  } catch (err) {
    console.error("[Ingest] Product stats update failed (non-blocking):", err);
  }

  // City stats
  try {
    if (params.shippingCity) {
      await updateCityStats({
        merchantId: params.merchantId,
        city: params.shippingCity,
        orderScore: params.scoringResult.score,
        orderTotal: params.total,
      });
    }
  } catch (err) {
    console.error("[Ingest] City stats update failed (non-blocking):", err);
  }

  // Zone stats
  try {
    if (params.parsedZone && params.parsedCity) {
      await updateZoneStats({
        merchantId: params.merchantId,
        city: params.parsedCity,
        zone: params.parsedZone,
        postalCode: params.parsedPostalCode ?? undefined,
        orderScore: params.scoringResult.score,
      });
    }
  } catch (err) {
    console.error("[Ingest] Zone stats update failed (non-blocking):", err);
  }
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

/** Calculate retention expiry date from now + months */
function retentionDate(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
