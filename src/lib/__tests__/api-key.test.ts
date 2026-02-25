import { describe, it, expect, vi } from "vitest";

// Mock DB module to avoid requiring DATABASE_URL in tests
vi.mock("@/db/index", () => ({
  db: {},
}));

import { hashApiKey, generateApiKey, extractApiKey } from "../api-key";

// ═══════════════════════════════════════════════════════════
// hashApiKey
// ═══════════════════════════════════════════════════════════

describe("hashApiKey", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const hash = hashApiKey("nt_live_abc123");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    const key = "nt_live_test_key_12345";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("different keys produce different hashes", () => {
    expect(hashApiKey("nt_live_aaa")).not.toBe(hashApiKey("nt_live_bbb"));
  });
});

// ═══════════════════════════════════════════════════════════
// generateApiKey
// ═══════════════════════════════════════════════════════════

describe("generateApiKey", () => {
  it("returns key with nt_live_ prefix", () => {
    const { key } = generateApiKey();
    expect(key.startsWith("nt_live_")).toBe(true);
  });

  it("key has correct length (8 prefix + 64 hex = 72 chars)", () => {
    const { key } = generateApiKey();
    expect(key.length).toBe(72);
  });

  it("hash matches hashApiKey(key)", () => {
    const { key, hash } = generateApiKey();
    expect(hash).toBe(hashApiKey(key));
  });

  it("generates unique keys each time", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key).not.toBe(b.key);
    expect(a.hash).not.toBe(b.hash);
  });
});

// ═══════════════════════════════════════════════════════════
// extractApiKey
// ═══════════════════════════════════════════════════════════

describe("extractApiKey", () => {
  function makeRequest(
    headers: Record<string, string> = {},
    url = "https://app.nortoo.ma/api/webhook/ingest"
  ): Request {
    return new Request(url, { headers });
  }

  it("extracts key from x-nortoo-key header", () => {
    const req = makeRequest({ "x-nortoo-key": "nt_live_abc" });
    expect(extractApiKey(req)).toBe("nt_live_abc");
  });

  it("extracts key from legacy x-codpilot-key header", () => {
    const req = makeRequest({ "x-codpilot-key": "cp_live_old" });
    expect(extractApiKey(req)).toBe("cp_live_old");
  });

  it("prefers x-nortoo-key over x-codpilot-key", () => {
    const req = makeRequest({
      "x-nortoo-key": "nt_live_new",
      "x-codpilot-key": "cp_live_old",
    });
    expect(extractApiKey(req)).toBe("nt_live_new");
  });

  it("extracts key from ?key= query param", () => {
    const req = makeRequest({}, "https://app.nortoo.ma/api?key=nt_live_qp");
    expect(extractApiKey(req)).toBe("nt_live_qp");
  });

  it("returns null when no key provided", () => {
    const req = makeRequest();
    expect(extractApiKey(req)).toBeNull();
  });

  it("respects allowQueryParam=false", () => {
    const req = makeRequest({}, "https://app.nortoo.ma/api?key=nt_live_qp");
    expect(extractApiKey(req, { allowQueryParam: false })).toBeNull();
  });
});
