import { scoreOrder, type VelocityData } from "@/lib/scoring";
import { generateExplanation } from "@/lib/score-explanation";
import type { GeoData, PhoneListOverride, ScoredOrder } from "./types";

/** Run scoring engine + apply auto-block, no-address, and phone list overrides */
export function applyScoring(params: {
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
