import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM field-level encryption for sensitive tokens (e.g., YouCan OAuth tokens).
 *
 * Requires env var TOKEN_ENCRYPTION_KEY = 64 hex chars (32 bytes).
 * Stored format: "iv:authTag:ciphertext" (all hex-encoded).
 */

const ALGO = "aes-256-gcm" as const;
const IV_BYTES = 12; // GCM standard
const TAG_BYTES = 16; // GCM standard

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY env var must be exactly 64 hex characters (32 bytes)"
    );
  }
  return Buffer.from(hex, "hex");
}

/** Encrypt a plaintext string → "iv:tag:ciphertext" (hex). */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Decrypt "iv:tag:ciphertext" (hex) → plaintext string. */
export function decrypt(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format — expected iv:tag:ciphertext");
  }
  const [ivHex, tagHex, encHex] = parts;
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Decrypt with backward compatibility for legacy plaintext tokens.
 * Legacy tokens don't contain ":" so they pass through unchanged.
 * Returns null if the input is null/undefined.
 */
export function decryptSafe(stored: string | null | undefined): string | null {
  if (!stored) return null;
  // Legacy plaintext tokens (YouCan access tokens) never contain ":"
  if (!stored.includes(":")) return stored;
  return decrypt(stored);
}
