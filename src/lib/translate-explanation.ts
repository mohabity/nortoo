/**
 * Build a translated score explanation at render time.
 * Replaces the server-generated French explanation stored in DB.
 */

const RULE_EMOJI: Record<string, string> = {
  R1_LOYAL: "\u2705", R2_KNOWN: "\u2705", R3_RECIDIVIST: "\u26A0\uFE0F",
  R4_ONE_FAIL: "\u26A0\uFE0F", R5_NEW: "\u2139\uFE0F",
  R13_BURST_1H: "\u26A1", R14_BURST_24H: "\u26A1", R15_MULTI_ADDR: "\u26A1",
  R16_HIGH_VALUE_24H: "\u26A1", R17_STEADY: "\u2705",
  R6_EXTREME: "\uD83D\uDCB0", "R6b_VERY_HIGH": "\uD83D\uDCB0",
  R7_HIGH: "\uD83D\uDCB0", R7b_ROUND: "\uD83D\uDCB0", "R7c_LOW": "\uD83D\uDCB0",
  R8b_ZONE_RISK: "\uD83D\uDCCD", R8_GEO_RISK: "\uD83D\uDCCD",
  R8_STATIC_HIGH: "\uD83D\uDCCD", R8_STATIC_MED: "\uD83D\uDCCD",
  R8c_SAFE_CITY: "\uD83D\uDCCD", R8_RISKY_ZONE: "\uD83D\uDCCD",
  R9_VERY_SHORT: "\uD83D\uDCDD", R9b_SHORT: "\uD83D\uDCDD",
  R10_GIBBERISH: "\uD83D\uDCDD", R10_NO_ADDR: "\uD83D\uDCDD",
  R10b_NUMBERS: "\uD83D\uDCDD", R10c_GOOD_ADDR: "\uD83D\uDCDD",
  R18_NO_NAME: "\uD83D\uDC64", R19_GIBBERISH_NAME: "\uD83D\uDC64",
  R20_SUSPECT_NAME: "\uD83D\uDC64", R21_SINGLE_WORD: "\uD83D\uDC64",
  R12_SKU_RISK: "\uD83D\uDCE6", R12_SKU_SAFE: "\uD83D\uDCE6",
  R22_HIGH_QTY: "\uD83D\uDCE6",
  R11_DEEP_NIGHT: "\uD83C\uDF19", R11b_NIGHT: "\uD83C\uDF19",
  R11c_PEAK: "\u2600\uFE0F", R11_NIGHT: "\uD83C\uDF19",
  R_NETWORK: "\uD83C\uDF10", R_NO_ADDRESS: "\uD83D\uDCDD",
  OPPOSITION: "\uD83D\uDEAB",
};

export interface TranslatedExplanation {
  summary: string;
  factors: string[];
  tip: string | null;
  emoji: string;
  confidenceLabel: string;
}

export function translateExplanation(
  score: number,
  decision: string,
  factors: { rule: string; points: number; reason: string }[],
  confidence: number,
  t: (key: string) => string,
): TranslatedExplanation {
  // Score range → intro
  let introKey: string;
  let emoji: string;
  if (score <= 20) { introKey = "scoring.explanation.reliable"; emoji = "\uD83D\uDFE2"; }
  else if (score <= 40) { introKey = "scoring.explanation.probablySafe"; emoji = "\uD83D\uDFE1"; }
  else if (score <= 60) { introKey = "scoring.explanation.needsVerification"; emoji = "\uD83D\uDFE0"; }
  else if (score <= 80) { introKey = "scoring.explanation.highRisk"; emoji = "\uD83D\uDD34"; }
  else { introKey = "scoring.explanation.veryRisky"; emoji = "\u26D4"; }

  const intro = t(introKey);

  // Top factors (exclude base, sort by |points|, top 4)
  const significant = factors
    .filter((f) => f.rule !== "R0_BASE")
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    .slice(0, 4);

  // Translate each factor
  const humanFactors = significant.map((f) => {
    const prefix = RULE_EMOJI[f.rule] ?? "\u2022";
    const translated = t(`scoring.rules.${f.rule}`);
    // If t() returns the key itself, fall back to original reason
    const label = translated.startsWith("scoring.rules.") ? f.reason : translated;
    return `${prefix} ${label}`;
  });

  // Summary: emoji + intro + top 2 translated reasons
  const topReasons = significant
    .slice(0, 2)
    .map((f) => {
      const translated = t(`scoring.rules.${f.rule}`);
      return translated.startsWith("scoring.rules.")
        ? f.reason.toLowerCase()
        : translated.toLowerCase();
    })
    .join(", ");

  const summaryBase = topReasons
    ? `${emoji} ${intro} \u2014 ${topReasons}`
    : `${emoji} ${intro}`;

  const summary =
    summaryBase.length > 120
      ? summaryBase.slice(0, 117) + "\u2026"
      : summaryBase;

  // Tip
  let tip: string | null = null;
  if (decision === "verify") tip = t("scoring.explanation.tipVerify");
  else if (decision === "flag") tip = t("scoring.explanation.tipFlag");
  else if (decision === "block") tip = t("scoring.explanation.tipBlock");

  // Confidence label
  let confidenceLabel: string;
  if (confidence >= 0.8) confidenceLabel = t("scoring.explanation.confidenceHigh");
  else if (confidence >= 0.5) confidenceLabel = t("scoring.explanation.confidenceMedium");
  else confidenceLabel = t("scoring.explanation.confidenceLow");

  return { summary, factors: humanFactors, tip, emoji, confidenceLabel };
}
