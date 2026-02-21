// ═══════════════════════════════════════════════════════════
// Scoring Simulation Engine
// Pure functions — zero DB calls, zero side effects.
// Used by POST /api/scoring/simulate + client-side live recalc.
// ═══════════════════════════════════════════════════════════

import type { Thresholds } from "./scoring";
import { rtoCost } from "./savings";

// ── Input / Output types ──

export interface SimOrderInput {
  id: number;
  externalRef: string | null;
  customerName: string | null;
  fraudScore: number;
  decision: string;
  deliveryStatus: string;
  total: number;
}

export interface SimOrderOutput {
  id: number;
  externalRef: string | null;
  customerName: string | null;
  originalScore: number;
  simulatedScore: number;
  originalDecision: string;
  simulatedDecision: string;
  deliveryStatus: string;
  total: number;
}

export interface DecisionDistribution {
  ship: number;
  verify: number;
  flag: number;
  block: number;
}

export interface SimulationResult {
  sampleSize: number;
  current: DecisionDistribution & { avgScore: number };
  simulated: DecisionDistribution & { avgScore: number };
  changes: {
    totalChanged: number;
    percentChanged: number;
    newlyBlocked: number;
    newlyShipped: number;
  };
  impact: {
    newlyBlockedDelivered: number;
    newlyBlockedReturned: number;
    newlyBlockedUnknown: number;
    estimatedSavingsGain: number;
    estimatedSalesLost: number;
    netBalance: number;
  };
  examples: SimOrderOutput[];
  warnings: string[];
  scores: { score: number; decision: string }[];
}

// ── Live client-side recalculation ──

export interface LiveDistribution {
  current: DecisionDistribution;
  simulated: DecisionDistribution;
  deltas: { ship: number; verify: number; flag: number; block: number };
  changedCount: number;
  changePercent: number;
}

// ── Helpers ──

const RISK_ORDER: Record<string, number> = {
  ship: 0,
  verify: 1,
  flag: 2,
  block: 3,
};

export function decisionFromScore(
  score: number,
  th: Thresholds
): "ship" | "verify" | "flag" | "block" {
  if (score <= th.verify) return "ship";
  if (score <= th.flag) return "verify";
  if (score <= th.block) return "flag";
  return "block";
}

function emptyDistribution(): DecisionDistribution {
  return { ship: 0, verify: 0, flag: 0, block: 0 };
}

// ── Full server-side simulation ──

export function simulateThresholds(
  orders: SimOrderInput[],
  currentThresholds: Thresholds,
  newThresholds: Thresholds,
  rtoCostFixed: number,
  rtoCostPercent: number
): SimulationResult {
  const current = emptyDistribution();
  const simulated = emptyDistribution();
  const changed: SimOrderOutput[] = [];

  let currentScoreSum = 0;
  let simulatedScoreSum = 0;
  let newlyBlocked = 0;
  let newlyShipped = 0;
  let newlyBlockedDelivered = 0;
  let newlyBlockedReturned = 0;
  let newlyBlockedUnknown = 0;
  let savingsGain = 0;
  let salesLost = 0;

  const scores: { score: number; decision: string }[] = [];

  for (const order of orders) {
    const score = order.fraudScore;
    currentScoreSum += score;
    simulatedScoreSum += score; // same score, just different thresholds

    // Original decision from current thresholds
    const origDecision = order.decision as keyof DecisionDistribution;
    current[origDecision]++;

    // New decision with new thresholds
    const newDecision = decisionFromScore(score, newThresholds);
    simulated[newDecision]++;

    scores.push({ score, decision: order.decision });

    if (newDecision !== origDecision) {
      changed.push({
        id: order.id,
        externalRef: order.externalRef,
        customerName: order.customerName,
        originalScore: score,
        simulatedScore: score,
        originalDecision: origDecision,
        simulatedDecision: newDecision,
        deliveryStatus: order.deliveryStatus,
        total: order.total,
      });

      const origRisk = RISK_ORDER[origDecision] ?? 0;
      const newRisk = RISK_ORDER[newDecision] ?? 0;

      // Moved to higher risk (e.g. ship → block)
      if (newRisk > origRisk && newDecision === "block") {
        newlyBlocked++;
        const cost = rtoCost(order.total, rtoCostFixed, rtoCostPercent);

        if (order.deliveryStatus === "returned") {
          newlyBlockedReturned++;
          savingsGain += cost;
        } else if (order.deliveryStatus === "delivered") {
          newlyBlockedDelivered++;
          salesLost += order.total;
        } else {
          newlyBlockedUnknown++;
        }
      }

      // Moved to lower risk (e.g. block → ship)
      if (newRisk < origRisk && origDecision === "block") {
        newlyShipped++;
      }
    }
  }

  const n = orders.length;
  const changePercent = n > 0 ? Math.round((changed.length / n) * 100) : 0;
  const netBalance = Math.round(savingsGain - salesLost);

  // Warnings
  const warnings: string[] = [];
  if (changePercent > 30) {
    warnings.push(
      `Ce réglage impacte plus de ${changePercent}% de vos commandes. Testez-le quelques jours avant de l'adopter définitivement.`
    );
  }
  if (netBalance < 0) {
    warnings.push(
      "Ce réglage pourrait vous coûter plus qu'il ne vous fait économiser."
    );
  }

  // Sort examples by impact: prioritize orders near threshold boundaries
  const sortedExamples = changed
    .sort((a, b) => {
      // Orders that went to/from block are most impactful
      const aImpact =
        Math.abs(
          (RISK_ORDER[a.simulatedDecision] ?? 0) -
            (RISK_ORDER[a.originalDecision] ?? 0)
        ) * 10 + a.total;
      const bImpact =
        Math.abs(
          (RISK_ORDER[b.simulatedDecision] ?? 0) -
            (RISK_ORDER[b.originalDecision] ?? 0)
        ) * 10 + b.total;
      return bImpact - aImpact;
    })
    .slice(0, 10);

  return {
    sampleSize: n,
    current: {
      ...current,
      avgScore: n > 0 ? Math.round((currentScoreSum / n) * 10) / 10 : 0,
    },
    simulated: {
      ...simulated,
      avgScore: n > 0 ? Math.round((simulatedScoreSum / n) * 10) / 10 : 0,
    },
    changes: {
      totalChanged: changed.length,
      percentChanged: changePercent,
      newlyBlocked,
      newlyShipped,
    },
    impact: {
      newlyBlockedDelivered,
      newlyBlockedReturned,
      newlyBlockedUnknown,
      estimatedSavingsGain: Math.round(savingsGain),
      estimatedSalesLost: Math.round(salesLost),
      netBalance,
    },
    examples: sortedExamples,
    warnings,
    scores,
  };
}

// ── Client-side live recalculation (threshold-only, instant) ──

export function recalculateDistribution(
  scores: { score: number; decision: string }[],
  currentThresholds: Thresholds,
  newThresholds: Thresholds
): LiveDistribution {
  const current = emptyDistribution();
  const simulated = emptyDistribution();
  let changedCount = 0;

  for (const { score, decision } of scores) {
    current[decision as keyof DecisionDistribution]++;
    const newDecision = decisionFromScore(score, newThresholds);
    simulated[newDecision]++;
    if (newDecision !== decision) changedCount++;
  }

  return {
    current,
    simulated,
    deltas: {
      ship: simulated.ship - current.ship,
      verify: simulated.verify - current.verify,
      flag: simulated.flag - current.flag,
      block: simulated.block - current.block,
    },
    changedCount,
    changePercent:
      scores.length > 0
        ? Math.round((changedCount / scores.length) * 100)
        : 0,
  };
}
