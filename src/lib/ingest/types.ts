import type { generateExplanation } from "@/lib/score-explanation";
import type { ScoringResult } from "@/lib/scoring";

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
// Internal types (shared between sub-modules)
// ═══════════════════════════════════════════════════════════

export interface PhoneListOverride {
  decision: "ship" | "block";
  reason: string;
}

export interface CustomerData {
  customerId: number;
  customerHistory?: { totalOrders: number; successfulOrders: number; failedOrders: number };
}

export interface GeoData {
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

export interface ScoredOrder {
  scoringResult: ScoringResult;
  decision: string;
  explanation: ReturnType<typeof generateExplanation>;
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

/** Calculate retention expiry date from now + months */
export function retentionDate(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
