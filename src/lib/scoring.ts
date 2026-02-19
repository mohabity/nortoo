// ═══════════════════════════════════════════════════════════
// CODPilot Scoring Engine v1.0
// 12 rules, score 0-100, 4 decision levels
// ═══════════════════════════════════════════════════════════

export const SCORING_VERSION = "v1.0";

export interface ScoringInput {
  total: number;
  city?: string;
  address?: string;
  hour?: number; // 0-23
  customer?: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
  };
  networkScore?: number; // Phase 2
}

export interface ScoringFactor {
  rule: string;
  points: number;
  reason: string;
}

export interface ScoringResult {
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  decision: "ship" | "verify" | "flag" | "block";
  factors: ScoringFactor[];
  confidence: number;
  version: string;
}

export interface Thresholds {
  verify: number;
  flag: number;
  block: number;
}

const DEFAULT_THRESHOLDS: Thresholds = {
  verify: 31,
  flag: 66,
  block: 86,
};

// Zones with historically high RTO rates in Morocco
const RISKY_ZONES = [
  "taza", "ouarzazate", "errachidia", "sidi slimane",
  "khouribga", "sidi kacem", "guelmim", "tan-tan", "tiznit",
];

/**
 * Score a COD order using 12 rules.
 * Returns a score 0-100 and a decision (ship/verify/flag/block).
 */
export function scoreOrder(
  input: ScoringInput,
  thresholds?: Thresholds
): ScoringResult {
  const th = thresholds ?? DEFAULT_THRESHOLDS;
  const factors: ScoringFactor[] = [];
  let rawScore = 0;

  // ─── R0: Base score ───
  factors.push({ rule: "R0_BASE", points: 25, reason: "Score de base" });
  rawScore += 25;

  // ─── Customer history rules ───
  const cust = input.customer;
  if (cust) {
    if (cust.successfulOrders >= 3) {
      // R1: Loyal customer
      factors.push({ rule: "R1_LOYAL", points: -20, reason: `Client fiable (${cust.successfulOrders} succès)` });
      rawScore -= 20;
    } else if (cust.successfulOrders >= 1) {
      // R2: Known customer
      factors.push({ rule: "R2_KNOWN", points: -10, reason: `Client connu (${cust.successfulOrders} succès)` });
      rawScore -= 10;
    }

    if (cust.failedOrders >= 2) {
      // R3: Recidivist
      factors.push({ rule: "R3_RECIDIVIST", points: 30, reason: `Récidiviste (${cust.failedOrders} échecs)` });
      rawScore += 30;
    } else if (cust.failedOrders === 1) {
      // R4: One previous failure
      factors.push({ rule: "R4_ONE_FAIL", points: 15, reason: "1 échec précédent" });
      rawScore += 15;
    }
  } else {
    // R5: New customer (no history)
    factors.push({ rule: "R5_NEW", points: 10, reason: "Nouveau client (aucun historique)" });
    rawScore += 10;
  }

  // ─── Amount rules ───
  if (input.total > 1000) {
    factors.push({ rule: "R6_VERY_HIGH", points: 20, reason: `Montant très élevé (${Math.round(input.total)} DH)` });
    rawScore += 20;
  } else if (input.total > 500) {
    factors.push({ rule: "R7_HIGH", points: 10, reason: `Montant élevé (${Math.round(input.total)} DH)` });
    rawScore += 10;
  }

  // ─── Geography rule ───
  if (input.city && RISKY_ZONES.includes(input.city.toLowerCase().trim())) {
    factors.push({ rule: "R8_RISKY_ZONE", points: 15, reason: `Zone à risque (${input.city})` });
    rawScore += 15;
  }

  // ─── Address quality rules ───
  if (input.address) {
    const addr = input.address.trim();
    if (addr.length < 15) {
      factors.push({ rule: "R9_SHORT_ADDR", points: 10, reason: "Adresse courte (< 15 caractères)" });
      rawScore += 10;
    }
    if (isGibberish(addr)) {
      factors.push({ rule: "R10_GIBBERISH", points: 15, reason: "Adresse suspecte" });
      rawScore += 15;
    }
  } else {
    factors.push({ rule: "R10_NO_ADDR", points: 15, reason: "Pas d'adresse fournie" });
    rawScore += 15;
  }

  // ─── Time rule ───
  if (input.hour !== undefined && input.hour >= 1 && input.hour <= 5) {
    factors.push({ rule: "R11_NIGHT", points: 5, reason: `Commande nocturne (${input.hour}h)` });
    rawScore += 5;
  }

  // ─── Network Intelligence (Phase 2) ───
  if (input.networkScore !== undefined && process.env.NETWORK_INTELLIGENCE_ENABLED === "true") {
    const netPoints = input.networkScore > 70 ? 20 : input.networkScore > 50 ? 10 : input.networkScore < 30 ? -15 : 0;
    if (netPoints !== 0) {
      factors.push({
        rule: "R_NETWORK",
        points: netPoints,
        reason: `Score réseau: ${input.networkScore}/100`,
      });
      rawScore += netPoints;
    }
  }

  // ─── Clamp score 0-100 ───
  const score = Math.max(0, Math.min(100, rawScore));

  // ─── Decision based on merchant thresholds ───
  let decision: ScoringResult["decision"];
  let riskLevel: ScoringResult["riskLevel"];

  if (score <= th.verify) {
    decision = "ship";
    riskLevel = "low";
  } else if (score <= th.flag) {
    decision = "verify";
    riskLevel = "medium";
  } else if (score <= th.block) {
    decision = "flag";
    riskLevel = "high";
  } else {
    decision = "block";
    riskLevel = "critical";
  }

  // ─── Confidence based on customer history ───
  let confidence = 0.5;
  if (cust) {
    if (cust.totalOrders >= 3) confidence = 0.9;
    else if (cust.totalOrders >= 1) confidence = 0.7;
  }

  return {
    score,
    riskLevel,
    decision,
    factors,
    confidence,
    version: SCORING_VERSION,
  };
}

/**
 * Check if an address looks like gibberish (random characters).
 */
function isGibberish(addr: string): boolean {
  const lower = addr.toLowerCase();

  // No vowels at all → suspicious
  const vowels = lower.match(/[aeiouyàâéèêëïîôùûü]/g);
  if (!vowels || vowels.length < 2) return true;

  // Too many consonant clusters → suspicious
  const consonantClusters = lower.match(/[^aeiouyàâéèêëïîôùûü\s\d,.-]{5,}/g);
  if (consonantClusters && consonantClusters.length > 0) return true;

  // Repeated characters → suspicious
  if (/(.)\1{3,}/.test(lower)) return true;

  return false;
}
