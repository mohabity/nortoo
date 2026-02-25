import { describe, it, expect } from "vitest";
import {
  hashBackupCode,
  generateBackupCodes,
  generateTOTPSecret,
  verifyTOTPCode,
} from "../totp";

// ═══════════════════════════════════════════════════════════
// hashBackupCode
// ═══════════════════════════════════════════════════════════

describe("hashBackupCode", () => {
  it("returns a 64-char hex string (SHA-256)", () => {
    const hash = hashBackupCode("A1B2C3D4");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashBackupCode("A1B2C3D4")).toBe(hashBackupCode("A1B2C3D4"));
  });

  it("normalizes to uppercase before hashing", () => {
    expect(hashBackupCode("a1b2c3d4")).toBe(hashBackupCode("A1B2C3D4"));
  });

  it("different codes produce different hashes", () => {
    expect(hashBackupCode("A1B2C3D4")).not.toBe(hashBackupCode("E5F6G7H8"));
  });
});

// ═══════════════════════════════════════════════════════════
// generateBackupCodes
// ═══════════════════════════════════════════════════════════

describe("generateBackupCodes", () => {
  it("generates exactly 8 codes", () => {
    const { raw, hashed } = generateBackupCodes();
    expect(raw).toHaveLength(8);
    expect(hashed).toHaveLength(8);
  });

  it("raw codes are 8-char uppercase hex", () => {
    const { raw } = generateBackupCodes();
    for (const code of raw) {
      expect(code).toMatch(/^[A-F0-9]{8}$/);
    }
  });

  it("hashed codes match hashBackupCode(raw)", () => {
    const { raw, hashed } = generateBackupCodes();
    for (let i = 0; i < raw.length; i++) {
      expect(hashed[i]).toBe(hashBackupCode(raw[i]));
    }
  });

  it("codes are unique", () => {
    const { raw } = generateBackupCodes();
    const unique = new Set(raw);
    expect(unique.size).toBe(8);
  });
});

// ═══════════════════════════════════════════════════════════
// generateTOTPSecret
// ═══════════════════════════════════════════════════════════

describe("generateTOTPSecret", () => {
  it("returns secret, otpAuthUrl, and qrDataUrl", async () => {
    const result = await generateTOTPSecret("test@nortoo.ma");
    expect(result.secret).toBeTruthy();
    expect(result.otpAuthUrl).toContain("otpauth://totp/");
    expect(result.otpAuthUrl).toContain("nortoo");
    // @ is URL-encoded as %40 in otpauth URI
    expect(result.otpAuthUrl).toMatch(/test(%40|@)nortoo\.ma/);
    expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

// ═══════════════════════════════════════════════════════════
// verifyTOTPCode
// ═══════════════════════════════════════════════════════════

describe("verifyTOTPCode", () => {
  it("returns false for obviously invalid code", () => {
    expect(verifyTOTPCode("JBSWY3DPEHPK3PXP", "000000")).toBe(false);
  });

  it("returns false for empty code", () => {
    expect(verifyTOTPCode("JBSWY3DPEHPK3PXP", "")).toBe(false);
  });

  it("returns false for non-numeric code", () => {
    expect(verifyTOTPCode("JBSWY3DPEHPK3PXP", "abcdef")).toBe(false);
  });
});
