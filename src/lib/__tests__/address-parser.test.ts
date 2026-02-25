import { describe, it, expect, vi } from "vitest";

// Mock DB module to avoid requiring DATABASE_URL in tests
vi.mock("@/db/index", () => ({
  db: {},
}));

import { parseAddress } from "../address-parser";

// ═══════════════════════════════════════════════════════════
// EMPTY / INVALID INPUTS
// ═══════════════════════════════════════════════════════════

describe("parseAddress — empty/invalid", () => {
  it("returns empty for null", () => {
    const result = parseAddress(null);
    expect(result.city).toBeNull();
    expect(result.zone).toBeNull();
    expect(result.postalCode).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("returns empty for undefined", () => {
    const result = parseAddress(undefined);
    expect(result.confidence).toBe(0);
  });

  it("returns empty for empty string", () => {
    const result = parseAddress("");
    expect(result.confidence).toBe(0);
  });

  it("returns empty for very short string (< 3 chars)", () => {
    const result = parseAddress("ab");
    expect(result.confidence).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// CITY DETECTION
// ═══════════════════════════════════════════════════════════

describe("parseAddress — city detection", () => {
  it("detects casablanca", () => {
    const result = parseAddress("Rue Mohammed V, Casablanca");
    expect(result.city).toBe("casablanca");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("detects rabat", () => {
    const result = parseAddress("Avenue Hassan II, Rabat");
    expect(result.city).toBe("rabat");
  });

  it("detects marrakech (with diacritics)", () => {
    const result = parseAddress("Résidence Al Fath, Marrakech 40000");
    expect(result.city).toBe("marrakech");
  });

  it("detects taza (high-risk city)", () => {
    const result = parseAddress("Centre ville, Taza");
    expect(result.city).toBe("taza");
  });

  it("is case insensitive", () => {
    const result = parseAddress("Rue 12, CASABLANCA");
    expect(result.city).toBe("casablanca");
  });
});

// ═══════════════════════════════════════════════════════════
// POSTAL CODE EXTRACTION
// ═══════════════════════════════════════════════════════════

describe("parseAddress — postal code", () => {
  it("extracts 5-digit postal code", () => {
    const result = parseAddress("Apt 5, Maarif, 20000 Casablanca");
    expect(result.postalCode).toBe("20000");
  });

  it("does not extract invalid postal codes (< 10000)", () => {
    const result = parseAddress("Apt 5, rue 09999 Casablanca");
    expect(result.postalCode).toBeNull();
  });

  it("extracts postal code from end of address", () => {
    const result = parseAddress("Résidence Al Fath, Marrakech 40000");
    expect(result.postalCode).toBe("40000");
  });
});

// ═══════════════════════════════════════════════════════════
// ZONE (QUARTIER) DETECTION
// ═══════════════════════════════════════════════════════════

describe("parseAddress — zone detection", () => {
  it("detects known zone: maarif in casablanca", () => {
    const result = parseAddress("Résidence Al Fath, Maarif, Casablanca");
    expect(result.city).toBe("casablanca");
    expect(result.zone).not.toBeNull();
  });

  it("detects zone from hay prefix", () => {
    const result = parseAddress("Hay Riad, Rabat, 10100");
    expect(result.zone).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════

describe("parseAddress — confidence", () => {
  it("high confidence for full address (city + zone + postal + numbers)", () => {
    const result = parseAddress(
      "Résidence Al Fath, Apt 12, Boulevard Mohammed V, Maarif, 20000 Casablanca"
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("lower confidence for city-only address", () => {
    const result = parseAddress("Casablanca");
    expect(result.confidence).toBeLessThan(0.7);
  });

  it("confidence is clamped to 1.0 max", () => {
    const result = parseAddress(
      "Résidence Al Fath, Apt 12, Boulevard Mohammed V, Quartier Maarif, 20000 Casablanca, Maroc"
    );
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });
});

// ═══════════════════════════════════════════════════════════
// ADDRESS CLEANING
// ═══════════════════════════════════════════════════════════

describe("parseAddress — cleaning", () => {
  it("strips 'Adresse:' prefix", () => {
    const result = parseAddress("Adresse: Rue 12, Casablanca");
    expect(result.city).toBe("casablanca");
  });

  it("normalizes diacritics", () => {
    const result = parseAddress("Résidence Fès, 30000");
    expect(result.postalCode).toBe("30000");
  });
});
