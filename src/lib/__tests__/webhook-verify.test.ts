import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "../webhook-verify";

const SECRET = "test-webhook-secret-12345";
const BODY = '{"order_id":"123","total":500}';

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

// ═══════════════════════════════════════════════════════════
// verifyWebhookSignature
// ═══════════════════════════════════════════════════════════

describe("verifyWebhookSignature", () => {
  it("returns true for valid signature", () => {
    const sig = sign(BODY, SECRET);
    expect(verifyWebhookSignature(BODY, sig, SECRET)).toBe(true);
  });

  it("returns false for invalid signature", () => {
    expect(verifyWebhookSignature(BODY, "bad_signature_hex", SECRET)).toBe(false);
  });

  it("returns false for null signature", () => {
    expect(verifyWebhookSignature(BODY, null, SECRET)).toBe(false);
  });

  it("returns false for empty secret", () => {
    const sig = sign(BODY, SECRET);
    expect(verifyWebhookSignature(BODY, sig, "")).toBe(false);
  });

  it("returns false for tampered body", () => {
    const sig = sign(BODY, SECRET);
    expect(verifyWebhookSignature(BODY + "x", sig, SECRET)).toBe(false);
  });

  it("returns false for wrong secret", () => {
    const sig = sign(BODY, SECRET);
    expect(verifyWebhookSignature(BODY, sig, "wrong-secret")).toBe(false);
  });
});
