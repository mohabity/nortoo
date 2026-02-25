import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizePhone,
  phoneLast4,
  hashPhone,
  maskPhone,
  hashIP,
} from "../hash";

// ═══════════════════════════════════════════════════════════
// normalizePhone
// ═══════════════════════════════════════════════════════════

describe("normalizePhone", () => {
  it("keeps already normalized +212 format", () => {
    expect(normalizePhone("+212661234567")).toBe("+212661234567");
  });

  it("converts 06 prefix to +212", () => {
    expect(normalizePhone("0661234567")).toBe("+212661234567");
  });

  it("converts 07 prefix to +212", () => {
    expect(normalizePhone("0712345678")).toBe("+212712345678");
  });

  it("handles 212 prefix without +", () => {
    expect(normalizePhone("212661234567")).toBe("+212661234567");
  });

  it("strips spaces, dashes, parentheses, dots", () => {
    expect(normalizePhone("+212 6 61-23.45(67)")).toBe("+212661234567");
  });

  it("adds 212 prefix to bare number", () => {
    expect(normalizePhone("661234567")).toBe("+212661234567");
  });
});

// ═══════════════════════════════════════════════════════════
// phoneLast4
// ═══════════════════════════════════════════════════════════

describe("phoneLast4", () => {
  it("extracts last 4 digits from full phone", () => {
    expect(phoneLast4("+212661234567")).toBe("4567");
  });

  it("extracts last 4 digits from short number", () => {
    expect(phoneLast4("1234")).toBe("1234");
  });

  it("handles phone with non-digit characters", () => {
    expect(phoneLast4("+212 661-234-567")).toBe("4567");
  });
});

// ═══════════════════════════════════════════════════════════
// hashPhone
// ═══════════════════════════════════════════════════════════

describe("hashPhone", () => {
  beforeEach(() => {
    vi.stubEnv("PHONE_HASH_SALT", "test-salt-for-ci");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a 64-char hex string (SHA-256)", () => {
    const hash = hashPhone("+212661234567");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic (same input → same hash)", () => {
    const a = hashPhone("+212661234567");
    const b = hashPhone("+212661234567");
    expect(a).toBe(b);
  });

  it("normalizes before hashing (0661… = +212661…)", () => {
    const fromLocal = hashPhone("0661234567");
    const fromInternational = hashPhone("+212661234567");
    expect(fromLocal).toBe(fromInternational);
  });

  it("different numbers produce different hashes", () => {
    const a = hashPhone("+212661234567");
    const b = hashPhone("+212661234568");
    expect(a).not.toBe(b);
  });

  it("throws if PHONE_HASH_SALT is missing", () => {
    vi.stubEnv("PHONE_HASH_SALT", "");
    // Re-import won't help because salt is read at call time
    // We need to delete it to test the throw
    delete process.env.PHONE_HASH_SALT;
    expect(() => hashPhone("+212661234567")).toThrow("PHONE_HASH_SALT");
  });
});

// ═══════════════════════════════════════════════════════════
// maskPhone
// ═══════════════════════════════════════════════════════════

describe("maskPhone", () => {
  it("masks middle digits: +212661234567 → 212XXXXXX567", () => {
    expect(maskPhone("+212661234567")).toBe("212XXXXXX567");
  });

  it("handles 06 prefix input", () => {
    expect(maskPhone("0661234567")).toBe("212XXXXXX567");
  });

  it("normalizes short input before masking", () => {
    // "12345" → normalizePhone → "+21212345" → 8 digits → "212XX345"
    const result = maskPhone("12345");
    expect(result).toContain("212");
  });
});

// ═══════════════════════════════════════════════════════════
// hashIP
// ═══════════════════════════════════════════════════════════

describe("hashIP", () => {
  it("returns a 16-char hex string", () => {
    const hash = hashIP("192.168.1.1");
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });

  it("is deterministic", () => {
    expect(hashIP("10.0.0.1")).toBe(hashIP("10.0.0.1"));
  });

  it("different IPs produce different hashes", () => {
    expect(hashIP("192.168.1.1")).not.toBe(hashIP("192.168.1.2"));
  });
});
