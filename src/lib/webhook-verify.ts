import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify HMAC-SHA256 webhook signature using constant-time comparison.
 * Returns false if signature is missing or invalid.
 *
 * @param rawBody - The raw request body string
 * @param signature - The signature from the webhook header (hex-encoded)
 * @param secret - The shared secret used to compute the HMAC
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    // Length mismatch or other error — not a valid signature
    return false;
  }
}
