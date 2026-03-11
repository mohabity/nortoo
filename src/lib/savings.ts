// ═══ Savings Calculator ═══
// Pure utility — no DB calls. Reused by savings API + email digest.


/**
 * Calculate the estimated cost of a single RTO (return to origin).
 * fixedCost + (orderAmount × variablePercent)
 */
export function rtoCost(
  orderAmount: number,
  fixedCost: number,
  variablePercent: number
): number {
  return fixedCost + orderAmount * variablePercent;
}

/**
 * Returns a probability multiplier (0–1) representing how likely
 * an order's blocking actually prevented an RTO.
 *
 * - auto_blocked → 100% (system caught it)
 * - merchant manually blocked (override) → 100%
 * - escalated or flagged → 60% (partial credit)
 * - everything else → 0%
 */
export function savingsProbability(
  pipelineStatus: string,
  decision: string
): number {
  if (pipelineStatus === "auto_blocked") return 1.0;
  if (decision === "block" && pipelineStatus === "merchant_override") return 1.0;
  if (pipelineStatus === "escalated" || decision === "flag") return 0.6;
  return 0;
}

// ── Email digest (prepare only — no sending logic) ──
export interface WeeklySavingsDigest {
  merchantName: string;
  period: { from: Date; to: Date };
  totalSaved: number;
  ordersSaved: number;
  roiMultiple: number | null;
  topProduct: { name: string; saved: number } | null;
  topCity: { name: string; saved: number } | null;
}
