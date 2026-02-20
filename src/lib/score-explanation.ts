/**
 * Score Explanation — Human-readable French explanations of fraud scores.
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
}

/** Emoji prefix per rule family */
const RULE_EMOJI: Record<string, string> = {
  R1_LOYAL: "\u2705",
  R2_KNOWN: "\u2705",
  R3_RECIDIVIST: "\u26A0\uFE0F",
  R4_ONE_FAIL: "\u26A0\uFE0F",
  R5_NEW: "\u2139\uFE0F",
  R6_VERY_HIGH: "\uD83D\uDCB0",
  R7_HIGH: "\uD83D\uDCB0",
  R8b_ZONE_RISK: "\uD83D\uDCCD",
  R8_GEO_RISK: "\uD83D\uDCCD",
  R8_RISKY_ZONE: "\uD83D\uDCCD",
  R9_SHORT_ADDR: "\uD83D\uDCDD",
  R10_GIBBERISH: "\uD83D\uDCDD",
  R10_NO_ADDR: "\uD83D\uDCDD",
  R11_NIGHT: "\uD83C\uDF19",
  R12_SKU_RISK: "\uD83D\uDCE6",
  R_NETWORK: "\uD83C\uDF10",
  OPPOSITION: "\uD83D\uDEAB",
};

/** Score range → emoji + intro phrase */
function getScoreRange(score: number): { emoji: string; intro: string } {
  if (score <= 20) return { emoji: "\uD83D\uDFE2", intro: "Commande fiable" };
  if (score <= 40) return { emoji: "\uD83D\uDFE1", intro: "Commande plut\u00F4t s\u00FBre" };
  if (score <= 60) return { emoji: "\uD83D\uDFE0", intro: "Commande \u00E0 v\u00E9rifier" };
  if (score <= 80) return { emoji: "\uD83D\uDD34", intro: "Risque \u00E9lev\u00E9 d\u00E9tect\u00E9" };
  return { emoji: "\u26D4", intro: "Commande tr\u00E8s risqu\u00E9e" };
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
  const { emoji, intro } = getScoreRange(score);

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
  };
}
