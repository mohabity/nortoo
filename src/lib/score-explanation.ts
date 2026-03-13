/**
 * Score Explanation — Human-readable explanations of fraud scores.
 *
 * Pure synchrone function. Zero DB calls, zero dependencies.
 * Converts technical scoring factors into merchant-friendly phrases.
 */

export interface ScoreExplanation {
  summary: string;
  factors: string[];
  tip: string | null;
  emoji: string;
  confidenceLabel: string;
  /** i18n key for the score-range intro (e.g. "reliable", "needsVerification") */
  introKey: string;
  /** Rule keys of the top 2 factors (for translated summary) */
  topRuleKeys: string[];
}

/** Emoji prefix per rule family */
const RULE_EMOJI: Record<string, string> = {
  // History
  R1_LOYAL: "\u2705",
  R2_KNOWN: "\u2705",
  R3_RECIDIVIST: "\u26A0\uFE0F",
  R4_ONE_FAIL: "\u26A0\uFE0F",
  R5_NEW: "\u2139\uFE0F",
  // Velocity (v2)
  R13_BURST_1H: "\u26A1",
  R14_BURST_24H: "\u26A1",
  R15_MULTI_ADDR: "\u26A1",
  R16_HIGH_VALUE_24H: "\u26A1",
  R17_STEADY: "\u2705",
  // Amount
  R6_EXTREME: "\uD83D\uDCB0",
  "R6b_VERY_HIGH": "\uD83D\uDCB0",
  R7_HIGH: "\uD83D\uDCB0",
  R7b_ROUND: "\uD83D\uDCB0",
  "R7c_LOW": "\uD83D\uDCB0",
  // Geography
  R8b_ZONE_RISK: "\uD83D\uDCCD",
  R8_GEO_RISK: "\uD83D\uDCCD",
  R8_STATIC_HIGH: "\uD83D\uDCCD",
  R8_STATIC_MED: "\uD83D\uDCCD",
  R8c_SAFE_CITY: "\uD83D\uDCCD",
  R8_RISKY_ZONE: "\uD83D\uDCCD",
  // Address
  R9_VERY_SHORT: "\uD83D\uDCDD",
  R9b_SHORT: "\uD83D\uDCDD",
  R10_GIBBERISH: "\uD83D\uDCDD",
  R10_NO_ADDR: "\uD83D\uDCDD",
  R10b_NUMBERS: "\uD83D\uDCDD",
  R10c_GOOD_ADDR: "\uD83D\uDCDD",
  // Name (v2)
  R18_NO_NAME: "\uD83D\uDC64",
  R19_GIBBERISH_NAME: "\uD83D\uDC64",
  R20_SUSPECT_NAME: "\uD83D\uDC64",
  R21_SINGLE_WORD: "\uD83D\uDC64",
  // Product
  R12_SKU_RISK: "\uD83D\uDCE6",
  R12_SKU_SAFE: "\uD83D\uDCE6",
  R22_HIGH_QTY: "\uD83D\uDCE6",
  // Temporality
  R11_DEEP_NIGHT: "\uD83C\uDF19",
  R11b_NIGHT: "\uD83C\uDF19",
  R11c_PEAK: "\u2600\uFE0F",
  R11_NIGHT: "\uD83C\uDF19",
  // Network
  R_NETWORK: "\uD83C\uDF10",
  // Other
  OPPOSITION: "\uD83D\uDEAB",
};

/** Score range → emoji + intro phrase + i18n key */
function getScoreRange(score: number): { emoji: string; intro: string; introKey: string } {
  if (score <= 20) return { emoji: "\uD83D\uDFE2", intro: "Commande fiable", introKey: "reliable" };
  if (score <= 40) return { emoji: "\uD83D\uDFE1", intro: "Commande plut\u00F4t s\u00FBre", introKey: "probablySafe" };
  if (score <= 60) return { emoji: "\uD83D\uDFE0", intro: "Commande \u00E0 v\u00E9rifier", introKey: "needsVerification" };
  if (score <= 80) return { emoji: "\uD83D\uDD34", intro: "Risque \u00E9lev\u00E9 d\u00E9tect\u00E9", introKey: "highRisk" };
  return { emoji: "\u26D4", intro: "Commande tr\u00E8s risqu\u00E9e", introKey: "veryRisky" };
}

/** Decision → actionable tip */
function getTip(decision: string): string | null {
  switch (decision) {
    case "verify":
      return "Conseil : Appelez le client pour confirmer la commande avant exp\u00E9dition.";
    case "flag":
      return "Conseil : V\u00E9rification approfondie recommand\u00E9e \u2014 consultez l\u2019historique client.";
    case "block":
      return "Conseil : Annulation recommand\u00E9e \u2014 le profil de risque est tr\u00E8s \u00E9lev\u00E9.";
    default:
      return null;
  }
}

/** Confidence 0-1 → French label */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "forte";
  if (confidence >= 0.5) return "moyenne";
  return "faible";
}

export function generateExplanation(
  score: number,
  decision: string,
  factors: { rule: string; points: number; reason: string }[],
  confidence: number
): ScoreExplanation {
  const { emoji, intro, introKey } = getScoreRange(score);

  // Filter out R0_BASE (noise), sort by |points| desc, keep top 4
  const significant = factors
    .filter((f) => f.rule !== "R0_BASE")
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    .slice(0, 4);

  // Build human phrases with emoji prefix
  const humanFactors = significant.map((f) => {
    const prefix = RULE_EMOJI[f.rule] ?? "\u2022";
    return `${prefix} ${f.reason}`;
  });

  // Build summary: emoji + intro + top 2 reasons (without emoji prefix)
  const topReasons = significant
    .slice(0, 2)
    .map((f) => f.reason.toLowerCase())
    .join(", ");

  const summaryBase = topReasons
    ? `${emoji} ${intro} \u2014 ${topReasons}`
    : `${emoji} ${intro}`;

  // Truncate to ~120 chars
  const summary =
    summaryBase.length > 120
      ? summaryBase.slice(0, 117) + "\u2026"
      : summaryBase;

  return {
    summary,
    factors: humanFactors,
    tip: getTip(decision),
    emoji,
    confidenceLabel: getConfidenceLabel(confidence),
    introKey,
    topRuleKeys: significant.slice(0, 2).map((f) => f.rule),
  };
}

/**
 * Score range → i18n intro key (for client-side translation).
 * Mirrors the server-side getScoreRange logic.
 */
export function getScoreIntroKey(score: number): { emoji: string; introKey: string } {
  if (score <= 20) return { emoji: "\uD83D\uDFE2", introKey: "reliable" };
  if (score <= 40) return { emoji: "\uD83D\uDFE1", introKey: "probablySafe" };
  if (score <= 60) return { emoji: "\uD83D\uDFE0", introKey: "needsVerification" };
  if (score <= 80) return { emoji: "\uD83D\uDD34", introKey: "highRisk" };
  return { emoji: "\u26D4", introKey: "veryRisky" };
}
