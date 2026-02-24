import { TOTP, generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const ISSUER = "nortoo";
const DIGITS = 6;
const PERIOD = 30;

/**
 * Generate a TOTP secret and QR code for 2FA setup.
 */
export async function generateTOTPSecret(email: string) {
  const secret = generateSecret();
  const otpAuthUrl = generateURI({
    issuer: ISSUER,
    label: email,
    secret,
    digits: DIGITS,
    period: PERIOD,
  });
  const qrDataUrl = await QRCode.toDataURL(otpAuthUrl);

  return { secret, otpAuthUrl, qrDataUrl };
}

/**
 * Verify a TOTP code against a secret.
 * Allows ±1 time window for clock drift.
 */
export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    const result = verifySync({
      secret,
      token: code,
      digits: DIGITS,
      period: PERIOD,
    });
    return result.valid === true;
  } catch {
    return false;
  }
}

/**
 * Generate 8 backup codes for 2FA recovery.
 * Returns { raw, hashed } — show raw to user, store hashed in DB.
 */
export function generateBackupCodes(): { raw: string[]; hashed: string[] } {
  const raw: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
    raw.push(code);
    hashed.push(hashBackupCode(code));
  }

  return { raw, hashed };
}

/**
 * Hash a backup code for storage.
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}
