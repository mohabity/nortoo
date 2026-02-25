import { describe, it, expect } from "vitest";
import { translateExplanation } from "../translate-explanation";

// Mock t() function that returns the key itself
// (simulates when a translation exists by returning lowercase of last segment)
function mockT(key: string): string {
  // For scoring.rules.*, return a human-readable label
  const ruleLabels: Record<string, string> = {
    "scoring.rules.R1_LOYAL": "Client fidèle",
    "scoring.rules.R3_RECIDIVIST": "Récidiviste",
    "scoring.rules.R5_NEW": "Nouveau client",
    "scoring.rules.R6_EXTREME": "Montant extrême",
    "scoring.rules.R8_STATIC_HIGH": "Ville à risque",
    "scoring.rules.R10_NO_ADDR": "Pas d'adresse",
    "scoring.rules.R11_DEEP_NIGHT": "Commande de nuit",
    "scoring.explanation.reliable": "Commande fiable",
    "scoring.explanation.probablySafe": "Probablement sûre",
    "scoring.explanation.needsVerification": "Vérification nécessaire",
    "scoring.explanation.highRisk": "Risque élevé",
    "scoring.explanation.veryRisky": "Très risqué",
    "scoring.explanation.tipVerify": "Vérifiez par téléphone",
    "scoring.explanation.tipFlag": "Attention particulière requise",
    "scoring.explanation.tipBlock": "Blocage recommandé",
    "scoring.explanation.confidenceHigh": "Confiance élevée",
    "scoring.explanation.confidenceMedium": "Confiance moyenne",
    "scoring.explanation.confidenceLow": "Confiance faible",
  };
  return ruleLabels[key] ?? key;
}

// ═══════════════════════════════════════════════════════════
// SCORE RANGES → EMOJI + INTRO
// ═══════════════════════════════════════════════════════════

describe("translateExplanation — score ranges", () => {
  const baseFactors = [
    { rule: "R5_NEW", points: 10, reason: "Nouveau client" },
  ];

  it("score ≤ 20 → green circle emoji + 'fiable'", () => {
    const result = translateExplanation(15, "ship", baseFactors, 0.9, mockT);
    expect(result.emoji).toBe("🟢");
    expect(result.summary).toContain("fiable");
  });

  it("score 21-40 → yellow circle emoji", () => {
    const result = translateExplanation(30, "ship", baseFactors, 0.8, mockT);
    expect(result.emoji).toBe("🟡");
  });

  it("score 41-60 → orange circle emoji", () => {
    const result = translateExplanation(50, "verify", baseFactors, 0.6, mockT);
    expect(result.emoji).toBe("🟠");
  });

  it("score 61-80 → red circle emoji", () => {
    const result = translateExplanation(70, "flag", baseFactors, 0.5, mockT);
    expect(result.emoji).toBe("🔴");
  });

  it("score > 80 → stop sign emoji + 'risqué'", () => {
    const result = translateExplanation(90, "block", baseFactors, 0.9, mockT);
    expect(result.emoji).toBe("⛔");
    expect(result.summary).toContain("risqué");
  });
});

// ═══════════════════════════════════════════════════════════
// FACTORS TRANSLATION
// ═══════════════════════════════════════════════════════════

describe("translateExplanation — factors", () => {
  it("translates factors with emoji prefix", () => {
    const factors = [
      { rule: "R1_LOYAL", points: -20, reason: "Client fidèle" },
      { rule: "R6_EXTREME", points: 25, reason: "Montant extrême" },
    ];
    const result = translateExplanation(35, "verify", factors, 0.8, mockT);

    // R6_EXTREME has higher |points| → should be first
    expect(result.factors[0]).toContain("💰");
    expect(result.factors[0]).toContain("Montant extrême");

    // R1_LOYAL second
    expect(result.factors[1]).toContain("✅");
    expect(result.factors[1]).toContain("Client fidèle");
  });

  it("excludes R0_BASE from factors", () => {
    const factors = [
      { rule: "R0_BASE", points: 20, reason: "Score de base" },
      { rule: "R5_NEW", points: 10, reason: "Nouveau client" },
    ];
    const result = translateExplanation(30, "ship", factors, 0.5, mockT);
    const hasBase = result.factors.some((f) => f.includes("Score de base"));
    expect(hasBase).toBe(false);
  });

  it("shows max 4 factors", () => {
    const factors = [
      { rule: "R3_RECIDIVIST", points: 30, reason: "r1" },
      { rule: "R6_EXTREME", points: 25, reason: "r2" },
      { rule: "R8_STATIC_HIGH", points: 15, reason: "r3" },
      { rule: "R10_NO_ADDR", points: 15, reason: "r4" },
      { rule: "R11_DEEP_NIGHT", points: 8, reason: "r5" },
      { rule: "R5_NEW", points: 10, reason: "r6" },
    ];
    const result = translateExplanation(90, "block", factors, 0.9, mockT);
    expect(result.factors.length).toBeLessThanOrEqual(4);
  });

  it("falls back to original reason if translation key is missing", () => {
    const factors = [
      { rule: "R_UNKNOWN_RULE", points: 10, reason: "Some custom reason" },
    ];
    const result = translateExplanation(30, "ship", factors, 0.5, mockT);
    expect(result.factors[0]).toContain("Some custom reason");
  });
});

// ═══════════════════════════════════════════════════════════
// TIPS
// ═══════════════════════════════════════════════════════════

describe("translateExplanation — tips", () => {
  const factors = [{ rule: "R5_NEW", points: 10, reason: "New" }];

  it("verify decision → tip", () => {
    const result = translateExplanation(40, "verify", factors, 0.5, mockT);
    expect(result.tip).toBe("Vérifiez par téléphone");
  });

  it("flag decision → tip", () => {
    const result = translateExplanation(70, "flag", factors, 0.5, mockT);
    expect(result.tip).toBe("Attention particulière requise");
  });

  it("block decision → tip", () => {
    const result = translateExplanation(90, "block", factors, 0.9, mockT);
    expect(result.tip).toBe("Blocage recommandé");
  });

  it("ship decision → no tip", () => {
    const result = translateExplanation(10, "ship", factors, 0.9, mockT);
    expect(result.tip).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// CONFIDENCE LABELS
// ═══════════════════════════════════════════════════════════

describe("translateExplanation — confidence", () => {
  const factors = [{ rule: "R5_NEW", points: 10, reason: "New" }];

  it("confidence ≥ 0.8 → high", () => {
    const result = translateExplanation(30, "ship", factors, 0.9, mockT);
    expect(result.confidenceLabel).toBe("Confiance élevée");
  });

  it("confidence 0.5-0.79 → medium", () => {
    const result = translateExplanation(30, "ship", factors, 0.6, mockT);
    expect(result.confidenceLabel).toBe("Confiance moyenne");
  });

  it("confidence < 0.5 → low", () => {
    const result = translateExplanation(30, "ship", factors, 0.3, mockT);
    expect(result.confidenceLabel).toBe("Confiance faible");
  });
});

// ═══════════════════════════════════════════════════════════
// SUMMARY TRUNCATION
// ═══════════════════════════════════════════════════════════

describe("translateExplanation — summary", () => {
  it("summary is ≤ 120 chars", () => {
    const factors = [
      { rule: "R3_RECIDIVIST", points: 30, reason: "Very long reason that explains the recidivist behavior in detail" },
      { rule: "R6_EXTREME", points: 25, reason: "Another very long reason about the extreme amount of this order" },
    ];
    const result = translateExplanation(90, "block", factors, 0.9, mockT);
    expect(result.summary.length).toBeLessThanOrEqual(120);
  });
});
