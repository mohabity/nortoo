import { createHash } from "crypto";

/**
 * Hash a phone number using SHA-256 with a salt.
 * Art. 23 Loi 09-08: Phone numbers must NEVER be stored in plain text.
 *
 * @param phone - Raw phone number (e.g., "+212661234567")
 * @returns SHA-256 hex digest
 */
export function hashPhone(phone: string): string {
  const salt = process.env.PHONE_HASH_SALT;
  if (!salt) {
    throw new Error("PHONE_HASH_SALT environment variable is required");
  }

  // Normalize: remove spaces, dashes, ensure +212 prefix
  const normalized = normalizePhone(phone);

  return createHash("sha256")
    .update(normalized + salt)
    .digest("hex");
}

/**
 * Extract last 4 digits of a phone number for display.
 * This is the ONLY part of the phone number stored in the database.
 */
export function phoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

/**
 * Normalize Moroccan phone numbers to a consistent format.
 * +212661234567, 0661234567, 212661234567 → +212661234567
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/[\s\-\(\)\.]/g, "");

  // Remove leading + if present
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  // Convert 06/07 prefix to 212 prefix
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "212" + digits.slice(1);
  }

  // Ensure 212 prefix
  if (!digits.startsWith("212")) {
    digits = "212" + digits;
  }

  return "+" + digits;
}

/**
 * Mask a phone number for display in lists.
 * Shows country code prefix + masked middle + last 3 digits.
 * Example: "+212661234567" → "212XXXXXX567"
 */
export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone); // "+212661234567"
  const digits = normalized.replace(/\D/g, ""); // "212661234567"
  if (digits.length <= 6) return digits; // Too short to mask
  const prefix = digits.slice(0, 3);  // "212"
  const suffix = digits.slice(-3);    // "567"
  const middle = "X".repeat(digits.length - 6); // "XXXXXX"
  return `${prefix}${middle}${suffix}`;
}

/**
 * Hash an IP address for audit logging.
 * We don't store raw IPs either.
 */
export function hashIP(ip: string): string {
  const salt = process.env.PHONE_HASH_SALT || "";
  return createHash("sha256").update(ip + salt).digest("hex").slice(0, 16);
}
