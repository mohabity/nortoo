// ── Order types (shared across components, pages, and API routes) ──

/** Row shape returned by GET /api/orders (list view) */
export interface OrderRow {
  id: number;
  externalRef: string | null;
  customerName: string | null;
  customerPhoneLast4: string | null;
  productName: string | null;
  total: number;
  shippingCity: string | null;
  fraudScore: number;
  decision: string;
  overrideDecision?: string | null;
  deliveryStatus: string;
  pipelineStatus: string;
  scoreExplanation?: string | null;
  reviewDeadline?: string | null;
  escalationPriority?: number | null;
  source?: string | null;
  createdAt: string;
}

/** Individual scoring factor from the scoring engine */
export interface ScoringFactor {
  rule: string;
  points: number;
  reason: string;
}

/** Customer history data attached to an order detail */
export interface CustomerData {
  id: number;
  name: string | null;
  city: string | null;
  phoneLast4: string | null;
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  firstSeen: string;
}

/** Full order detail returned by GET /api/orders/[id] (slide-over) */
export interface OrderDetail {
  id: number;
  externalRef: string | null;
  customerName: string | null;
  customerPhoneLast4: string | null;
  productName: string | null;
  total: number;
  currency: string;
  shippingCity: string | null;
  shippingAddress: string | null;
  parsedCity: string | null;
  parsedZone: string | null;
  parsedPostalCode: string | null;
  addressConfidence: number | null;
  fraudScore: number;
  riskLevel: string;
  decision: string;
  overrideDecision: string | null;
  overrideBy: string | null;
  overrideReason: string | null;
  overrideAt: string | null;
  deliveryStatus: string;
  pipelineStatus: string;
  pipelineProcessedAt: string | null;
  reviewDeadline: string | null;
  escalatedAt: string | null;
  escalationPriority: number | null;
  merchantNotifiedAt: string | null;
  scoringVersion: string | null;
  scoreExplanation: {
    summary: string;
    factors: string[];
    tip: string | null;
    emoji: string;
    confidenceLabel: string;
  } | null;
  createdAt: string;
  scoredAt: string;
  scoringFactors: ScoringFactor[];
  confidence: number;
  customer: CustomerData | null;
}

/** Decision counts for filter pills */
export interface OrdersCounts {
  all: number;
  ship: number;
  verify: number;
  flag: number;
  block: number;
}

/** Pagination meta returned by GET /api/orders */
export interface OrdersMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
  nextCursor?: string;
  prevCursor?: string;
  counts: OrdersCounts;
}

/** Search suggestion from GET /api/orders/search-suggest */
export interface SearchSuggestion {
  type: "client" | "city" | "product";
  value: string;
  count: number;
}
