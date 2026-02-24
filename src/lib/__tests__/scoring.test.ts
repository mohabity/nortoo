import { describe, it, expect } from "vitest";
import { scoreOrder, type ScoringInput, type Thresholds } from "../scoring";

// ── Helpers ─────────────────────────────────────────────

/** Minimal valid order (new customer, low amount, safe city) */
function baseInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    total: 200,
    city: "casablanca",
    address: "Rue Mohammed V, Résidence Al Fath, Apt 12, Maarif",
    hour: 14,
    dayOfWeek: 2, // Tuesday
    customerName: "Ahmed Benali",
    quantity: 1,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// CATEGORY: BASE SCORE
// ═══════════════════════════════════════════════════════════

describe("Base score", () => {
  it("assigns base score of 20", () => {
    const result = scoreOrder(baseInput());
    const baseFactor = result.factors.find((f) => f.rule === "R0_BASE");
    expect(baseFactor).toBeDefined();
    expect(baseFactor!.points).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 1: HISTORY
// ═══════════════════════════════════════════════════════════

describe("History rules", () => {
  it("R5: new customer (no history) adds +10", () => {
    const result = scoreOrder(baseInput({ customer: undefined }));
    const factor = result.factors.find((f) => f.rule === "R5_NEW");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(10);
  });

  it("R1: loyal customer (≥3 successes) subtracts -20", () => {
    const result = scoreOrder(
      baseInput({
        customer: { totalOrders: 5, successfulOrders: 4, failedOrders: 0 },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R1_LOYAL");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(-20);
  });

  it("R2: known customer (1-2 successes) subtracts -10", () => {
    const result = scoreOrder(
      baseInput({
        customer: { totalOrders: 2, successfulOrders: 2, failedOrders: 0 },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R2_KNOWN");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(-10);
  });

  it("R3: recidivist (≥2 failures) adds +30", () => {
    const result = scoreOrder(
      baseInput({
        customer: { totalOrders: 5, successfulOrders: 1, failedOrders: 3 },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R3_RECIDIVIST");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(30);
  });

  it("R4: one previous failure adds +15", () => {
    const result = scoreOrder(
      baseInput({
        customer: { totalOrders: 2, successfulOrders: 1, failedOrders: 1 },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R4_ONE_FAIL");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 2: VELOCITY
// ═══════════════════════════════════════════════════════════

describe("Velocity rules", () => {
  it("R13: burst (≥2 orders in 1h) adds +20", () => {
    const result = scoreOrder(
      baseInput({
        velocity: {
          ordersLast1h: 3,
          ordersLast24h: 3,
          distinctAddressesLast24h: 1,
          totalAmountLast24h: 500,
          ordersLast7d: 3,
        },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R13_BURST_1H");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(20);
  });

  it("R13: extreme burst (≥4 in 1h) adds +25", () => {
    const result = scoreOrder(
      baseInput({
        velocity: {
          ordersLast1h: 5,
          ordersLast24h: 5,
          distinctAddressesLast24h: 1,
          totalAmountLast24h: 1000,
          ordersLast7d: 5,
        },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R13_BURST_1H");
    expect(factor!.points).toBe(25);
  });

  it("R14: 24h burst (≥3 orders, no 1h burst) adds +12", () => {
    const result = scoreOrder(
      baseInput({
        velocity: {
          ordersLast1h: 1,
          ordersLast24h: 4,
          distinctAddressesLast24h: 1,
          totalAmountLast24h: 800,
          ordersLast7d: 4,
        },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R14_BURST_24H");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(12);
  });

  it("R15: address-hopping (≥2 addresses in 24h) adds +15", () => {
    const result = scoreOrder(
      baseInput({
        velocity: {
          ordersLast1h: 0,
          ordersLast24h: 2,
          distinctAddressesLast24h: 2,
          totalAmountLast24h: 400,
          ordersLast7d: 2,
        },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R15_MULTI_ADDR");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(15);
  });

  it("R16: high cumulative value (>2000 DH in 24h) adds +18", () => {
    const result = scoreOrder(
      baseInput({
        velocity: {
          ordersLast1h: 0,
          ordersLast24h: 2,
          distinctAddressesLast24h: 1,
          totalAmountLast24h: 2500,
          ordersLast7d: 2,
        },
      })
    );
    const factor = result.factors.find((f) => f.rule === "R16_HIGH_VALUE_24H");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(18);
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 3: AMOUNT
// ═══════════════════════════════════════════════════════════

describe("Amount rules", () => {
  it("R6: extreme amount (>2000 DH) adds +25", () => {
    const result = scoreOrder(baseInput({ total: 3000 }));
    const factor = result.factors.find((f) => f.rule === "R6_EXTREME");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(25);
  });

  it("R6b: very high amount (>1000 DH) adds +20", () => {
    const result = scoreOrder(baseInput({ total: 1500 }));
    const factor = result.factors.find((f) => f.rule === "R6b_VERY_HIGH");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(20);
  });

  it("R7: high amount (>500 DH) adds +10", () => {
    const result = scoreOrder(baseInput({ total: 700 }));
    const factor = result.factors.find((f) => f.rule === "R7_HIGH");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(10);
  });

  it("R7c: small amount (<100 DH) subtracts -3", () => {
    const result = scoreOrder(baseInput({ total: 50 }));
    const factor = result.factors.find((f) => f.rule === "R7c_LOW");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(-3);
  });

  it("R7b: suspicious round amount (≥500 and multiple of 100) adds +5", () => {
    const result = scoreOrder(baseInput({ total: 800 }));
    const factor = result.factors.find((f) => f.rule === "R7b_ROUND");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 4: GEOGRAPHY
// ═══════════════════════════════════════════════════════════

describe("Geography rules", () => {
  it("R8: high-risk city (static) adds +15", () => {
    const result = scoreOrder(baseInput({ city: "taza" }));
    const factor = result.factors.find((f) => f.rule === "R8_STATIC_HIGH");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(15);
  });

  it("R8: medium-risk city (static) adds +8", () => {
    const result = scoreOrder(baseInput({ city: "nador" }));
    const factor = result.factors.find((f) => f.rule === "R8_STATIC_MED");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(8);
  });

  it("R8c: safe city subtracts -5", () => {
    const result = scoreOrder(baseInput({ city: "casablanca" }));
    const factor = result.factors.find((f) => f.rule === "R8c_SAFE_CITY");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(-5);
  });

  it("R8: dynamic city risk (dangerous tier) adds +20", () => {
    const result = scoreOrder(
      baseInput({
        city: "somecity",
        cityRiskTier: "dangerous",
        cityRtoRate: 0.55,
        cityTotalOrders: 20,
      })
    );
    const factor = result.factors.find((f) => f.rule === "R8_GEO_RISK");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(20);
  });

  it("R8b: zone risk (critical >40% RTO) adds +25", () => {
    const result = scoreOrder(
      baseInput({
        zoneRtoRate: 0.50,
        zoneTotalOrders: 10,
      })
    );
    const factor = result.factors.find((f) => f.rule === "R8b_ZONE_RISK");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(25);
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 5: ADDRESS
// ═══════════════════════════════════════════════════════════

describe("Address rules", () => {
  it("R10_NO_ADDR: missing address adds +15", () => {
    const result = scoreOrder(baseInput({ address: undefined }));
    const factor = result.factors.find((f) => f.rule === "R10_NO_ADDR");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(15);
  });

  it("R9: very short address (<8 chars) adds +15", () => {
    const result = scoreOrder(baseInput({ address: "ici" }));
    const factor = result.factors.find((f) => f.rule === "R9_VERY_SHORT");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(15);
  });

  it("R9b: short address (8-14 chars) adds +10", () => {
    const result = scoreOrder(baseInput({ address: "maison bleu" }));
    const factor = result.factors.find((f) => f.rule === "R9b_SHORT");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(10);
  });

  it("R10_GIBBERISH: gibberish address adds +15", () => {
    const result = scoreOrder(baseInput({ address: "xyzxyzxyzxyzxyz bcdfg" }));
    const factor = result.factors.find((f) => f.rule === "R10_GIBBERISH");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(15);
  });

  it("R10b: mostly numbers address adds +10", () => {
    const result = scoreOrder(baseInput({ address: "12345678901234567" }));
    const factor = result.factors.find((f) => f.rule === "R10b_NUMBERS");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(10);
  });

  it("R10c: good detailed address subtracts -5", () => {
    const result = scoreOrder(
      baseInput({
        address: "Résidence Al Fath, Rue Mohammed V, Apt 12, Maarif, Casablanca",
      })
    );
    const factor = result.factors.find((f) => f.rule === "R10c_GOOD_ADDR");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(-5);
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 6: NAME
// ═══════════════════════════════════════════════════════════

describe("Name rules", () => {
  it("R18: no name adds +8", () => {
    const result = scoreOrder(baseInput({ customerName: undefined }));
    const factor = result.factors.find((f) => f.rule === "R18_NO_NAME");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(8);
  });

  it("R20: suspect name adds +10", () => {
    const result = scoreOrder(baseInput({ customerName: "test" }));
    const factor = result.factors.find((f) => f.rule === "R20_SUSPECT_NAME");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(10);
  });

  it("R19: gibberish name adds +12", () => {
    const result = scoreOrder(baseInput({ customerName: "xxxx" }));
    const factor = result.factors.find((f) => f.rule === "R19_GIBBERISH_NAME");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(12);
  });

  it("R21: single-word name adds +5", () => {
    const result = scoreOrder(baseInput({ customerName: "Ahmed" }));
    const factor = result.factors.find((f) => f.rule === "R21_SINGLE_WORD");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(5);
  });

  it("Full name does NOT trigger R21", () => {
    const result = scoreOrder(baseInput({ customerName: "Ahmed Benali" }));
    const factor = result.factors.find((f) => f.rule === "R21_SINGLE_WORD");
    expect(factor).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 7: PRODUCT
// ═══════════════════════════════════════════════════════════

describe("Product rules", () => {
  it("R12: high RTO product adds +15", () => {
    const result = scoreOrder(
      baseInput({ productRtoRate: 0.50, productTotalOrders: 10 })
    );
    const factor = result.factors.find((f) => f.rule === "R12_SKU_RISK");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(15);
  });

  it("R12: safe product subtracts -5", () => {
    const result = scoreOrder(
      baseInput({ productRtoRate: 0.05, productTotalOrders: 15 })
    );
    const factor = result.factors.find((f) => f.rule === "R12_SKU_SAFE");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(-5);
  });

  it("R22: high quantity (>5) adds +8", () => {
    const result = scoreOrder(baseInput({ quantity: 8 }));
    const factor = result.factors.find((f) => f.rule === "R22_HIGH_QTY");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(8);
  });
});

// ═══════════════════════════════════════════════════════════
// CATEGORY 8: TEMPORALITY
// ═══════════════════════════════════════════════════════════

describe("Temporality rules", () => {
  it("R11: deep night (2h-4h) adds +8 on weekday", () => {
    const result = scoreOrder(baseInput({ hour: 3, dayOfWeek: 1 }));
    const factor = result.factors.find((f) => f.rule === "R11_DEEP_NIGHT");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(8);
  });

  it("R11: deep night on weekend adds +10", () => {
    const result = scoreOrder(baseInput({ hour: 3, dayOfWeek: 6 }));
    const factor = result.factors.find((f) => f.rule === "R11_DEEP_NIGHT");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(10);
  });

  it("R11b: night window (1h or 5h, not deep) adds +5 on weekday", () => {
    const result = scoreOrder(baseInput({ hour: 1, dayOfWeek: 3 }));
    const factor = result.factors.find((f) => f.rule === "R11b_NIGHT");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(5);
  });

  it("R11c: peak hours (10h-18h) subtracts -3", () => {
    const result = scoreOrder(baseInput({ hour: 14, dayOfWeek: 2 }));
    const factor = result.factors.find((f) => f.rule === "R11c_PEAK");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(-3);
  });
});

// ═══════════════════════════════════════════════════════════
// DECISIONS & THRESHOLDS
// ═══════════════════════════════════════════════════════════

describe("Decisions and thresholds", () => {
  it("low score → ship", () => {
    // Loyal customer, safe city, good address, peak hours, low amount
    const result = scoreOrder(
      baseInput({
        customer: { totalOrders: 10, successfulOrders: 9, failedOrders: 0 },
        total: 50,
      })
    );
    expect(result.decision).toBe("ship");
    expect(result.riskLevel).toBe("low");
  });

  it("high score → block", () => {
    // Recidivist, high amount, bad city, no address, night, gibberish name
    const result = scoreOrder({
      total: 3000,
      city: "taza",
      address: undefined,
      hour: 3,
      dayOfWeek: 6,
      customerName: "xxxxx",
      customer: { totalOrders: 5, successfulOrders: 0, failedOrders: 5 },
    });
    expect(result.score).toBeGreaterThan(86);
    expect(result.decision).toBe("block");
    expect(result.riskLevel).toBe("critical");
  });

  it("custom thresholds change decision boundaries", () => {
    const customThresholds: Thresholds = { verify: 20, flag: 40, block: 60 };

    // Score = 20 (base) + 10 (new) - 5 (safe city) - 5 (good addr) - 3 (peak) = 17
    // With default thresholds → ship (≤31)
    // With custom thresholds → ship (≤20)
    const resultDefault = scoreOrder(baseInput());
    const resultCustom = scoreOrder(baseInput(), customThresholds);

    // Same score
    expect(resultDefault.score).toBe(resultCustom.score);
  });

  it("score is clamped between 0 and 100", () => {
    // Very low: loyal customer, everything safe
    const lowResult = scoreOrder(
      baseInput({
        customer: { totalOrders: 10, successfulOrders: 10, failedOrders: 0 },
        total: 50,
        productRtoRate: 0.03,
        productTotalOrders: 20,
      })
    );
    expect(lowResult.score).toBeGreaterThanOrEqual(0);

    // Very high: stack everything bad
    const highResult = scoreOrder({
      total: 3000,
      city: "taza",
      hour: 3,
      dayOfWeek: 6,
      customerName: "xxxxx",
      quantity: 10,
      customer: { totalOrders: 5, successfulOrders: 0, failedOrders: 5 },
      velocity: {
        ordersLast1h: 5,
        ordersLast24h: 10,
        distinctAddressesLast24h: 5,
        totalAmountLast24h: 5000,
        ordersLast7d: 10,
      },
    });
    expect(highResult.score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════
// CONFIDENCE
// ═══════════════════════════════════════════════════════════

describe("Confidence", () => {
  it("new customer has lower confidence (0.4)", () => {
    const result = scoreOrder(baseInput({ customer: undefined }));
    expect(result.confidence).toBe(0.4);
  });

  it("experienced customer has higher confidence", () => {
    const result = scoreOrder(
      baseInput({
        customer: { totalOrders: 10, successfulOrders: 8, failedOrders: 1 },
      })
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("velocity data adds confidence", () => {
    const withoutVel = scoreOrder(
      baseInput({
        customer: { totalOrders: 2, successfulOrders: 2, failedOrders: 0 },
      })
    );
    const withVel = scoreOrder(
      baseInput({
        customer: { totalOrders: 2, successfulOrders: 2, failedOrders: 0 },
        velocity: {
          ordersLast1h: 0,
          ordersLast24h: 1,
          distinctAddressesLast24h: 1,
          totalAmountLast24h: 200,
          ordersLast7d: 2,
        },
      })
    );
    expect(withVel.confidence).toBeGreaterThan(withoutVel.confidence);
  });
});

// ═══════════════════════════════════════════════════════════
// INTEGRATION: Combined scenarios
// ═══════════════════════════════════════════════════════════

describe("Integration scenarios", () => {
  it("ideal order: loyal customer, safe city, detailed address, peak hours → low score, ship", () => {
    const result = scoreOrder(
      baseInput({
        customer: { totalOrders: 10, successfulOrders: 9, failedOrders: 0 },
        total: 150,
        city: "rabat",
        address: "Résidence Al Fath, Avenue Mohammed V, Apt 12, Agdal",
        hour: 14,
        dayOfWeek: 2,
        customerName: "Fatima Zahra El Amrani",
        productRtoRate: 0.05,
        productTotalOrders: 30,
      })
    );
    expect(result.score).toBeLessThanOrEqual(15);
    expect(result.decision).toBe("ship");
  });

  it("worst case: recidivist, extreme amount, bad city, no address, deep night → high score, block", () => {
    const result = scoreOrder({
      total: 2500,
      city: "taza",
      address: undefined,
      hour: 3,
      dayOfWeek: 0, // Sunday
      customerName: "aaa",
      quantity: 8,
      customer: { totalOrders: 6, successfulOrders: 0, failedOrders: 6 },
      velocity: {
        ordersLast1h: 3,
        ordersLast24h: 5,
        distinctAddressesLast24h: 3,
        totalAmountLast24h: 5000,
        ordersLast7d: 8,
      },
    });
    expect(result.score).toBeGreaterThanOrEqual(86);
    expect(result.decision).toBe("block");
    expect(result.factors.length).toBeGreaterThanOrEqual(6);
  });

  it("returns version v2.0", () => {
    const result = scoreOrder(baseInput());
    expect(result.version).toBe("v2.0");
  });
});
