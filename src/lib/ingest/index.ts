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

import { hashPhone, phoneLast4 } from "@/lib/hash";
import { checkQuota, QuotaExceededError } from "@/lib/quota";
import { normalizeProductId } from "@/lib/product-stats";

import type { IngestParams, IngestResult } from "./types";
import { lookupPhoneList, checkOpposition, handleOpposedOrder } from "./opposition";
import { upsertCustomer } from "./customer";
import { gatherGeoData } from "./geo-data";
import { computeVelocity } from "./velocity";
import { applyScoring } from "./scoring-apply";
import { saveOrder } from "./save-order";
import { recordMetrics } from "./metrics";

export type { IngestParams, IngestResult };
export { QuotaExceededError };

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
