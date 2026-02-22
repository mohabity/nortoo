// ═══════════════════════════════════════════════════════════
// nortoo Scoring Engine v2.0
// 24 rules · 34 checks · 8 categories · score 0-100
//
// Categories:
//   1. History    (R1–R5)   — Customer track record
//   2. Velocity   (R13–R17) — Ordering speed / burst detection
//   3. Amount     (R6–R7)   — Order value analysis
//   4. Geography  (R8)      — City & zone risk
//   5. Address    (R9–R10)  — Address quality
//   6. Name       (R18–R21) — Customer name analysis
//   7. Product    (R12,R22) — SKU risk & quantity
//   8. Temporality(R11)     — Time-based patterns
//
// Base score: 20 (down from 25 in v1)
// ═══════════════════════════════════════════════════════════

export const SCORING_VERSION = "v2.0";

// ── Interfaces ────────────────────────────────────────────

export interface VelocityData {
  ordersLast1h: number;
  ordersLast24h: number;
  distinctAddressesLast24h: number;
  totalAmountLast24h: number;
  ordersLast7d: number;
}

export interface ScoringInput {
  total: number;
  city?: string;
  address?: string;
  hour?: number; // 0-23
  dayOfWeek?: number; // 0=Sunday, 6=Saturday
  customerName?: string;
  quantity?: number;
  customer?: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
  };
  velocity?: VelocityData;
  // Network Intelligence (Phase 2)
  networkScore?: number;
  // Product risk (from product_stats)
  productRtoRate?: number;
  productTotalOrders?: number;
  // City risk (from city_stats)
  cityRtoRate?: number;
  cityRiskTier?: string;
  cityTotalOrders?: number;
  // Zone risk (from zone_stats)
  zoneRtoRate?: number;
  zoneTotalOrders?: number;
  zoneDataSource?: "merchant" | "network" | "static";
}

export interface ScoringFactor {
  rule: string;
  points: number;
  reason: string;
  category: string;
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

// ── Reference Data ────────────────────────────────────────

/** Cities with historically high RTO rates (static fallback) */
const HIGH_RISK_CITIES = new Set([
  "taza", "ouarzazate", "errachidia", "sidi slimane",
  "khouribga", "sidi kacem", "guelmim", "tan-tan", "tiznit",
  "zagora", "taroudant", "midelt", "boulemane", "figuig",
]);

/** Cities with moderate RTO rates */
const MEDIUM_RISK_CITIES = new Set([
  "oujda", "berkane", "nador", "larache", "ksar el kebir",
  "settat", "beni mellal", "khemisset", "tiflet", "azrou",
]);

/** Major cities with reliable delivery */
const SAFE_CITIES = new Set([
  "casablanca", "rabat", "marrakech", "tanger", "agadir",
  "fes", "meknes", "kenitra", "tetouan", "mohammedia",
  "el jadida", "sale", "temara", "oujda",
]);

/** Known fake / placeholder names */
const SUSPECT_NAMES = new Set([
  "test", "aaa", "bbb", "xxx", "yyy", "zzz",
  "client", "customer", "fake", "faux", "essai", "demo",
  "none", "rien", "pas de nom", "inconnu", "unknown",
  "null", "undefined", "n/a", "na", "aucun", "noname",
  "asdf", "qwerty", "abcd", "1234", "azerty",
]);

// ── Main Scoring Function ─────────────────────────────────

/**
 * Score a COD order using 24 rules (34 checks) across 8 categories.
 * Returns a score 0-100 and a decision (ship/verify/flag/block).
 */
export function scoreOrder(
  input: ScoringInput,
  thresholds?: Thresholds
): ScoringResult {
  const th = thresholds ?? DEFAULT_THRESHOLDS;
  const factors: ScoringFactor[] = [];
  let rawScore = 0;

  // ═══════════════════════════════════════════════════════
  // R0: Base score (20)
  // ═══════════════════════════════════════════════════════
  factors.push({ rule: "R0_BASE", points: 20, reason: "Score de base", category: "base" });
  rawScore += 20;

  // ═══════════════════════════════════════════════════════
  // CATEGORY 1: HISTORY (R1–R5)
  // ═══════════════════════════════════════════════════════
  const cust = input.customer;
  if (cust) {
    if (cust.successfulOrders >= 3) {
      // R1: Loyal customer — strong track record
      factors.push({
        rule: "R1_LOYAL", points: -20,
        reason: `Client fiable (${cust.successfulOrders} succès)`,
        category: "history",
      });
      rawScore -= 20;
    } else if (cust.successfulOrders >= 1) {
      // R2: Known customer — some history
      factors.push({
        rule: "R2_KNOWN", points: -10,
        reason: `Client connu (${cust.successfulOrders} succès)`,
        category: "history",
      });
      rawScore -= 10;
    }

    if (cust.failedOrders >= 2) {
      // R3: Recidivist — multiple failures
      factors.push({
        rule: "R3_RECIDIVIST", points: 30,
        reason: `Récidiviste (${cust.failedOrders} échecs)`,
        category: "history",
      });
      rawScore += 30;
    } else if (cust.failedOrders === 1) {
      // R4: One previous failure
      factors.push({
        rule: "R4_ONE_FAIL", points: 15,
        reason: "1 échec précédent",
        category: "history",
      });
      rawScore += 15;
    }
  } else {
    // R5: New customer (no history)
    factors.push({
      rule: "R5_NEW", points: 10,
      reason: "Nouveau client (aucun historique)",
      category: "history",
    });
    rawScore += 10;
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY 2: VELOCITY (R13–R17) — NEW in v2
  // ═══════════════════════════════════════════════════════
  const vel = input.velocity;
  if (vel) {
    // R13: Burst in last hour (≥2 orders → suspicious)
    if (vel.ordersLast1h >= 2) {
      const pts = vel.ordersLast1h >= 4 ? 25 : 20;
      factors.push({
        rule: "R13_BURST_1H", points: pts,
        reason: `${vel.ordersLast1h} commandes en 1h`,
        category: "velocity",
      });
      rawScore += pts;
    }

    // R14: Burst in last 24h (≥3 orders)
    if (vel.ordersLast24h >= 3 && vel.ordersLast1h < 2) {
      // Only if R13 didn't already fire (avoid double-counting)
      factors.push({
        rule: "R14_BURST_24H", points: 12,
        reason: `${vel.ordersLast24h} commandes en 24h`,
        category: "velocity",
      });
      rawScore += 12;
    }

    // R15: Multiple addresses in 24h (address-hopping)
    if (vel.distinctAddressesLast24h >= 2) {
      const pts = vel.distinctAddressesLast24h >= 3 ? 20 : 15;
      factors.push({
        rule: "R15_MULTI_ADDR", points: pts,
        reason: `${vel.distinctAddressesLast24h} adresses différentes en 24h`,
        category: "velocity",
      });
      rawScore += pts;
    }

    // R16: High cumulative value in 24h
    if (vel.totalAmountLast24h > 2000) {
      factors.push({
        rule: "R16_HIGH_VALUE_24H", points: 18,
        reason: `${Math.round(vel.totalAmountLast24h)} DH cumulés en 24h`,
        category: "velocity",
      });
      rawScore += 18;
    }

    // R17: Steady customer — regular orders, good track record
    if (
      vel.ordersLast7d >= 5 &&
      cust &&
      cust.totalOrders >= 5 &&
      cust.successfulOrders / cust.totalOrders > 0.7
    ) {
      factors.push({
        rule: "R17_STEADY", points: -8,
        reason: `Client régulier (${vel.ordersLast7d} commandes/7j, ${Math.round(cust.successfulOrders / cust.totalOrders * 100)}% succès)`,
        category: "velocity",
      });
      rawScore -= 8;
    }
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY 3: AMOUNT (R6–R7)
  // ═══════════════════════════════════════════════════════
  if (input.total > 2000) {
    // R6: Extreme amount
    factors.push({
      rule: "R6_EXTREME", points: 25,
      reason: `Montant extrême (${Math.round(input.total)} DH)`,
      category: "amount",
    });
    rawScore += 25;
  } else if (input.total > 1000) {
    // R6b: Very high amount
    factors.push({
      rule: "R6b_VERY_HIGH", points: 20,
      reason: `Montant très élevé (${Math.round(input.total)} DH)`,
      category: "amount",
    });
    rawScore += 20;
  } else if (input.total > 500) {
    // R7: High amount
    factors.push({
      rule: "R7_HIGH", points: 10,
      reason: `Montant élevé (${Math.round(input.total)} DH)`,
      category: "amount",
    });
    rawScore += 10;
  } else if (input.total < 100 && input.total > 0) {
    // R7c: Small order — generally safer
    factors.push({
      rule: "R7c_LOW", points: -3,
      reason: `Petit montant (${Math.round(input.total)} DH)`,
      category: "amount",
    });
    rawScore -= 3;
  }

  // R7b: Suspicious round amount (≥500 and exact multiple of 100)
  if (input.total >= 500 && input.total % 100 === 0) {
    factors.push({
      rule: "R7b_ROUND", points: 5,
      reason: `Montant rond suspect (${Math.round(input.total)} DH)`,
      category: "amount",
    });
    rawScore += 5;
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY 4: GEOGRAPHY (R8, R8b)
  // ═══════════════════════════════════════════════════════

  // R8b: Zone (quartier) risk — most granular, takes precedence
  let geoRuleApplied = false;
  if (
    input.zoneRtoRate !== undefined &&
    input.zoneTotalOrders !== undefined &&
    input.zoneTotalOrders >= 5
  ) {
    const rtoPct = Math.round(input.zoneRtoRate * 100);
    const src = input.zoneDataSource === "network" ? " (réseau)" : "";
    if (input.zoneRtoRate > 0.40) {
      factors.push({ rule: "R8b_ZONE_RISK", points: 25, reason: `Quartier critique (${rtoPct}% RTO)${src}`, category: "geography" });
      rawScore += 25;
      geoRuleApplied = true;
    } else if (input.zoneRtoRate > 0.30) {
      factors.push({ rule: "R8b_ZONE_RISK", points: 18, reason: `Quartier risque élevé (${rtoPct}% RTO)${src}`, category: "geography" });
      rawScore += 18;
      geoRuleApplied = true;
    } else if (input.zoneRtoRate > 0.20) {
      factors.push({ rule: "R8b_ZONE_RISK", points: 10, reason: `Quartier risque modéré (${rtoPct}% RTO)${src}`, category: "geography" });
      rawScore += 10;
      geoRuleApplied = true;
    } else if (input.zoneRtoRate > 0.10) {
      factors.push({ rule: "R8b_ZONE_RISK", points: 5, reason: `Quartier à surveiller (${rtoPct}% RTO)${src}`, category: "geography" });
      rawScore += 5;
      geoRuleApplied = true;
    } else if (input.zoneTotalOrders >= 10 && input.zoneRtoRate <= 0.08) {
      factors.push({ rule: "R8b_ZONE_RISK", points: -8, reason: `Quartier fiable (${rtoPct}% RTO)${src}`, category: "geography" });
      rawScore -= 8;
      geoRuleApplied = true;
    }
  }

  // R8: City-level risk (only if zone didn't apply)
  if (!geoRuleApplied && input.city) {
    const cityLower = input.city.toLowerCase().trim();

    if (
      input.cityRiskTier &&
      input.cityRiskTier !== "unknown" &&
      input.cityTotalOrders !== undefined &&
      input.cityTotalOrders >= 5
    ) {
      // Dynamic scoring from real data
      const rtoPct = Math.round((input.cityRtoRate ?? 0) * 100);
      if (input.cityRiskTier === "dangerous") {
        factors.push({ rule: "R8_GEO_RISK", points: 20, reason: `Zone critique — ${input.city} (${rtoPct}% RTO)`, category: "geography" });
        rawScore += 20;
      } else if (input.cityRiskTier === "risky") {
        factors.push({ rule: "R8_GEO_RISK", points: 15, reason: `Zone risque élevé — ${input.city} (${rtoPct}% RTO)`, category: "geography" });
        rawScore += 15;
      } else if (input.cityRiskTier === "moderate") {
        factors.push({ rule: "R8_GEO_RISK", points: 8, reason: `Zone risque modéré — ${input.city} (${rtoPct}% RTO)`, category: "geography" });
        rawScore += 8;
      } else if (input.cityRiskTier === "safe" && input.cityTotalOrders >= 10) {
        factors.push({ rule: "R8_GEO_RISK", points: -5, reason: `Zone fiable — ${input.city} (${rtoPct}% RTO)`, category: "geography" });
        rawScore -= 5;
      }
    } else {
      // Static fallback lists
      if (HIGH_RISK_CITIES.has(cityLower)) {
        factors.push({ rule: "R8_STATIC_HIGH", points: 15, reason: `Zone à risque élevé (${input.city})`, category: "geography" });
        rawScore += 15;
      } else if (MEDIUM_RISK_CITIES.has(cityLower)) {
        factors.push({ rule: "R8_STATIC_MED", points: 8, reason: `Zone à risque modéré (${input.city})`, category: "geography" });
        rawScore += 8;
      } else if (SAFE_CITIES.has(cityLower)) {
        // R8c: Bonus for known safe cities (only static fallback)
        factors.push({ rule: "R8c_SAFE_CITY", points: -5, reason: `Ville fiable (${input.city})`, category: "geography" });
        rawScore -= 5;
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY 5: ADDRESS QUALITY (R9–R10)
  // ═══════════════════════════════════════════════════════
  if (input.address && typeof input.address === "string") {
    const addr = input.address.trim();

    if (addr.length < 8) {
      // R9: Very short address
      factors.push({ rule: "R9_VERY_SHORT", points: 15, reason: "Adresse très courte (< 8 caractères)", category: "address" });
      rawScore += 15;
    } else if (addr.length < 15) {
      // R9b: Short address
      factors.push({ rule: "R9b_SHORT", points: 10, reason: "Adresse courte (< 15 caractères)", category: "address" });
      rawScore += 10;
    } else if (addr.length >= 30 && hasLocationKeywords(addr)) {
      // R10c: Good detailed address with location keywords
      factors.push({ rule: "R10c_GOOD_ADDR", points: -5, reason: "Adresse détaillée", category: "address" });
      rawScore -= 5;
    }

    if (isGibberish(addr)) {
      // R10: Gibberish address
      factors.push({ rule: "R10_GIBBERISH", points: 15, reason: "Adresse suspecte (charabia)", category: "address" });
      rawScore += 15;
    }

    if (isMostlyNumbers(addr)) {
      // R10b: Address is mostly numbers
      factors.push({ rule: "R10b_NUMBERS", points: 10, reason: "Adresse composée principalement de chiffres", category: "address" });
      rawScore += 10;
    }
  } else {
    // R10_NO_ADDR: Missing address
    factors.push({ rule: "R10_NO_ADDR", points: 15, reason: "Pas d'adresse fournie", category: "address" });
    rawScore += 15;
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY 6: NAME ANALYSIS (R18–R21) — NEW in v2
  // ═══════════════════════════════════════════════════════
  if (input.customerName) {
    const name = input.customerName.trim();
    const nameLower = name.toLowerCase();

    if (name.length === 0) {
      factors.push({ rule: "R18_NO_NAME", points: 8, reason: "Nom client vide", category: "name" });
      rawScore += 8;
    } else {
      // R20: Suspect/fake name
      if (SUSPECT_NAMES.has(nameLower) || SUSPECT_NAMES.has(nameLower.split(" ")[0])) {
        factors.push({
          rule: "R20_SUSPECT_NAME", points: 10,
          reason: `Nom suspect (${name})`,
          category: "name",
        });
        rawScore += 10;
      }

      // R19: Gibberish name (random characters)
      if (isGibberishName(name)) {
        factors.push({
          rule: "R19_GIBBERISH_NAME", points: 12,
          reason: `Nom charabia (${name})`,
          category: "name",
        });
        rawScore += 12;
      }

      // R21: Single word name (no family name)
      const words = name.split(/\s+/).filter(w => w.length > 0);
      if (words.length === 1 && words[0].length < 10) {
        factors.push({
          rule: "R21_SINGLE_WORD", points: 5,
          reason: `Nom incomplet (${name})`,
          category: "name",
        });
        rawScore += 5;
      }
    }
  } else {
    // R18: No name provided
    factors.push({ rule: "R18_NO_NAME", points: 8, reason: "Nom client absent", category: "name" });
    rawScore += 8;
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY 7: PRODUCT RISK (R12, R22)
  // ═══════════════════════════════════════════════════════

  // R12: Dynamic SKU risk (from product_stats)
  if (input.productRtoRate !== undefined && input.productTotalOrders !== undefined) {
    const rtoPct = Math.round(input.productRtoRate * 100);
    if (input.productTotalOrders >= 5 && input.productRtoRate > 0.40) {
      factors.push({ rule: "R12_SKU_RISK", points: 15, reason: `Produit à haut risque RTO (${rtoPct}%)`, category: "product" });
      rawScore += 15;
    } else if (input.productTotalOrders >= 10 && input.productRtoRate > 0.25) {
      factors.push({ rule: "R12_SKU_RISK", points: 10, reason: `Produit à risque modéré (${rtoPct}%)`, category: "product" });
      rawScore += 10;
    } else if (input.productTotalOrders >= 20 && input.productRtoRate > 0.15) {
      factors.push({ rule: "R12_SKU_RISK", points: 5, reason: `Produit à surveiller (${rtoPct}% RTO)`, category: "product" });
      rawScore += 5;
    } else if (input.productTotalOrders >= 10 && input.productRtoRate < 0.10) {
      factors.push({ rule: "R12_SKU_SAFE", points: -5, reason: `Produit fiable (${rtoPct}% RTO)`, category: "product" });
      rawScore -= 5;
    }
  }

  // R22: High quantity (> 5 items in one order)
  if (input.quantity !== undefined && input.quantity > 5) {
    factors.push({
      rule: "R22_HIGH_QTY", points: 8,
      reason: `Quantité élevée (${input.quantity} articles)`,
      category: "product",
    });
    rawScore += 8;
  }

  // ═══════════════════════════════════════════════════════
  // CATEGORY 8: TEMPORALITY (R11)
  // ═══════════════════════════════════════════════════════
  if (input.hour !== undefined) {
    const isWeekend = input.dayOfWeek === 0 || input.dayOfWeek === 6;

    if (input.hour >= 2 && input.hour <= 4) {
      // R11: Deep night (2h-4h) — highest risk
      const pts = isWeekend ? 10 : 8;
      factors.push({
        rule: "R11_DEEP_NIGHT", points: pts,
        reason: `Commande en pleine nuit (${input.hour}h)${isWeekend ? " + weekend" : ""}`,
        category: "temporality",
      });
      rawScore += pts;
    } else if (input.hour >= 1 && input.hour <= 5) {
      // R11b: Night window (1h-5h, excluding deep night)
      const pts = isWeekend ? 7 : 5;
      factors.push({
        rule: "R11b_NIGHT", points: pts,
        reason: `Commande nocturne (${input.hour}h)${isWeekend ? " + weekend" : ""}`,
        category: "temporality",
      });
      rawScore += pts;
    } else if (input.hour >= 10 && input.hour <= 18) {
      // R11c: Peak hours bonus — slightly safer
      factors.push({
        rule: "R11c_PEAK", points: -3,
        reason: `Heures de bureau (${input.hour}h)`,
        category: "temporality",
      });
      rawScore -= 3;
    }
  }

  // ═══════════════════════════════════════════════════════
  // NETWORK INTELLIGENCE (Phase 2)
  // ═══════════════════════════════════════════════════════
  if (input.networkScore !== undefined && process.env.NETWORK_INTELLIGENCE_ENABLED === "true") {
    const netPoints = input.networkScore > 70 ? 20 : input.networkScore > 50 ? 10 : input.networkScore < 30 ? -15 : 0;
    if (netPoints !== 0) {
      factors.push({
        rule: "R_NETWORK", points: netPoints,
        reason: `Score réseau: ${input.networkScore}/100`,
        category: "network",
      });
      rawScore += netPoints;
    }
  }

  // ═══════════════════════════════════════════════════════
  // FINAL: Clamp, decide, confidence
  // ═══════════════════════════════════════════════════════
  const score = Math.max(0, Math.min(100, rawScore));

  // Decision based on merchant thresholds
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

  // Confidence based on data richness
  let confidence = 0.4; // baseline
  if (cust) {
    if (cust.totalOrders >= 5) confidence = 0.95;
    else if (cust.totalOrders >= 3) confidence = 0.85;
    else if (cust.totalOrders >= 1) confidence = 0.7;
  }
  if (vel) confidence = Math.min(1, confidence + 0.05); // velocity data adds confidence
  if (input.productRtoRate !== undefined) confidence = Math.min(1, confidence + 0.03);
  if (input.zoneRtoRate !== undefined || input.cityRtoRate !== undefined) {
    confidence = Math.min(1, confidence + 0.03);
  }

  return {
    score,
    riskLevel,
    decision,
    factors,
    confidence: Math.round(confidence * 100) / 100,
    version: SCORING_VERSION,
  };
}

// ── Helper Functions ──────────────────────────────────────

/**
 * Check if an address looks like gibberish (random characters).
 */
function isGibberish(addr: string): boolean {
  const lower = addr.toLowerCase();

  // No vowels at all → suspicious
  const vowels = lower.match(/[aeiouyàâéèêëïîôùûü]/g);
  if (!vowels || vowels.length < 2) return true;

  // Too many consonant clusters → suspicious
  const consonantClusters = lower.match(/[^aeiouyàâéèêëïîôùûü\s\d,.\-/]{5,}/g);
  if (consonantClusters && consonantClusters.length > 0) return true;

  // Repeated characters → suspicious
  if (/(.)\1{3,}/.test(lower)) return true;

  return false;
}

/**
 * Check if a name looks like gibberish.
 */
function isGibberishName(name: string): boolean {
  const lower = name.toLowerCase().trim();

  // Too short to be a real name
  if (lower.length <= 1) return true;

  // All same character
  if (/^(.)\1+$/.test(lower)) return true;

  // No vowels in a name longer than 3 chars
  if (lower.length > 3) {
    const vowels = lower.match(/[aeiouyàâéèêëïîôùûü]/g);
    if (!vowels || vowels.length === 0) return true;
  }

  // Keyboard patterns
  if (/^[qwerty]+$|^[azerty]+$|^[asdf]+$/i.test(lower.replace(/\s/g, ""))) return true;

  // Too many consecutive consonants (>4 in a row)
  if (/[^aeiouyàâéèêëïîôùûü\s]{5,}/i.test(lower)) return true;

  return false;
}

/**
 * Check if an address is mostly numbers (e.g., "12345678").
 */
function isMostlyNumbers(addr: string): boolean {
  const stripped = addr.replace(/[\s\-,./#]/g, "");
  if (stripped.length < 3) return false;
  const digits = stripped.replace(/\D/g, "");
  return digits.length / stripped.length > 0.7;
}

/**
 * Check if an address contains location-related keywords.
 */
function hasLocationKeywords(addr: string): boolean {
  const lower = addr.toLowerCase();
  const keywords = [
    "rue", "av", "avenue", "boulevard", "blvd", "bd",
    "lot", "résidence", "residence", "immeuble", "quartier",
    "hay", "derb", "zanqa", "nr", "n°", "etage", "étage",
    "appt", "appartement", "bloc", "sect", "secteur",
  ];
  return keywords.some(kw => lower.includes(kw));
}
