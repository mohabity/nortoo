import { describe, it, expect } from "vitest";
import {
  getPlanConfig,
  hasFeature,
  getOrderLimit,
  getUserLimit,
  getBulkLimit,
  isTrialExpired,
  trialDaysRemaining,
  minimumPlanFor,
  checkOrderLimit,
  PLAN_CONFIGS,
  PLAN_ORDER,
} from "../plans";

// ═══════════════════════════════════════════════════════════
// getPlanConfig
// ═══════════════════════════════════════════════════════════

describe("getPlanConfig", () => {
  it("returns trial config", () => {
    const config = getPlanConfig("trial");
    expect(config.id).toBe("trial");
    expect(config.price).toBe(0);
  });

  it("returns starter config", () => {
    const config = getPlanConfig("starter");
    expect(config.id).toBe("starter");
    expect(config.price).toBe(299);
  });

  it("returns pro config", () => {
    const config = getPlanConfig("pro");
    expect(config.id).toBe("pro");
    expect(config.price).toBe(699);
  });

  it("returns scale config", () => {
    const config = getPlanConfig("scale");
    expect(config.id).toBe("scale");
    expect(config.price).toBe(1499);
  });

  it("defaults to trial for unknown plan", () => {
    const config = getPlanConfig("enterprise");
    expect(config.id).toBe("trial");
  });
});

// ═══════════════════════════════════════════════════════════
// hasFeature
// ═══════════════════════════════════════════════════════════

describe("hasFeature", () => {
  it("trial has scoring", () => {
    expect(hasFeature("trial", "scoring")).toBe(true);
  });

  it("trial does NOT have csv_export", () => {
    expect(hasFeature("trial", "csv_export")).toBe(false);
  });

  it("starter has csv_export", () => {
    expect(hasFeature("starter", "csv_export")).toBe(true);
  });

  it("starter does NOT have pdf_report", () => {
    expect(hasFeature("starter", "pdf_report")).toBe(false);
  });

  it("pro has pdf_report", () => {
    expect(hasFeature("pro", "pdf_report")).toBe(true);
  });

  it("pro does NOT have roles", () => {
    expect(hasFeature("pro", "roles")).toBe(false);
  });

  it("scale has roles", () => {
    expect(hasFeature("scale", "roles")).toBe(true);
  });

  it("scale has all features", () => {
    const allFeatures = PLAN_CONFIGS.scale.features;
    for (const feature of allFeatures) {
      expect(hasFeature("scale", feature)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// getOrderLimit
// ═══════════════════════════════════════════════════════════

describe("getOrderLimit", () => {
  it("trial = 50", () => {
    expect(getOrderLimit("trial")).toBe(50);
  });

  it("starter = 500", () => {
    expect(getOrderLimit("starter")).toBe(500);
  });

  it("pro = 2000", () => {
    expect(getOrderLimit("pro")).toBe(2000);
  });

  it("scale = 0 (unlimited)", () => {
    expect(getOrderLimit("scale")).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// getUserLimit
// ═══════════════════════════════════════════════════════════

describe("getUserLimit", () => {
  it("trial = 1", () => {
    expect(getUserLimit("trial")).toBe(1);
  });

  it("pro = 3", () => {
    expect(getUserLimit("pro")).toBe(3);
  });

  it("scale = 10", () => {
    expect(getUserLimit("scale")).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════
// getBulkLimit
// ═══════════════════════════════════════════════════════════

describe("getBulkLimit", () => {
  it("trial = 0 (no bulk)", () => {
    expect(getBulkLimit("trial")).toBe(0);
  });

  it("starter = 20", () => {
    expect(getBulkLimit("starter")).toBe(20);
  });

  it("pro = 50", () => {
    expect(getBulkLimit("pro")).toBe(50);
  });

  it("scale = 0 (unlimited)", () => {
    expect(getBulkLimit("scale")).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// isTrialExpired
// ═══════════════════════════════════════════════════════════

describe("isTrialExpired", () => {
  it("returns false for null (no trial tracking)", () => {
    expect(isTrialExpired(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isTrialExpired(undefined)).toBe(false);
  });

  it("returns true for past date", () => {
    const pastDate = new Date("2024-01-01");
    expect(isTrialExpired(pastDate)).toBe(true);
  });

  it("returns false for future date", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(isTrialExpired(futureDate)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// trialDaysRemaining
// ═══════════════════════════════════════════════════════════

describe("trialDaysRemaining", () => {
  it("returns 0 for null", () => {
    expect(trialDaysRemaining(null)).toBe(0);
  });

  it("returns 0 for expired trial", () => {
    const pastDate = new Date("2024-01-01");
    expect(trialDaysRemaining(pastDate)).toBe(0);
  });

  it("returns positive number for active trial", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const days = trialDaysRemaining(futureDate);
    expect(days).toBeGreaterThanOrEqual(6);
    expect(days).toBeLessThanOrEqual(8);
  });
});

// ═══════════════════════════════════════════════════════════
// minimumPlanFor
// ═══════════════════════════════════════════════════════════

describe("minimumPlanFor", () => {
  it("scoring → trial (available in all plans)", () => {
    expect(minimumPlanFor("scoring")).toBe("trial");
  });

  it("csv_export → starter", () => {
    expect(minimumPlanFor("csv_export")).toBe("starter");
  });

  it("pdf_report → pro", () => {
    expect(minimumPlanFor("pdf_report")).toBe("pro");
  });

  it("roles → scale", () => {
    expect(minimumPlanFor("roles")).toBe("scale");
  });
});

// ═══════════════════════════════════════════════════════════
// checkOrderLimit
// ═══════════════════════════════════════════════════════════

describe("checkOrderLimit", () => {
  it("under limit", () => {
    const result = checkOrderLimit("trial", 30);
    expect(result.overLimit).toBe(false);
    expect(result.current).toBe(30);
    expect(result.limit).toBe(50);
    expect(result.percent).toBe(60);
  });

  it("at limit → over", () => {
    const result = checkOrderLimit("trial", 50);
    expect(result.overLimit).toBe(true);
    expect(result.percent).toBe(100);
  });

  it("over limit", () => {
    const result = checkOrderLimit("trial", 75);
    expect(result.overLimit).toBe(true);
    expect(result.percent).toBe(100); // capped at 100
  });

  it("unlimited plan (scale) is never over limit", () => {
    const result = checkOrderLimit("scale", 999999);
    expect(result.overLimit).toBe(false);
    expect(result.limit).toBe(0);
    expect(result.percent).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// PLAN_ORDER
// ═══════════════════════════════════════════════════════════

describe("PLAN_ORDER", () => {
  it("has correct order: trial → starter → pro → scale", () => {
    expect(PLAN_ORDER).toEqual(["trial", "starter", "pro", "scale"]);
  });
});
