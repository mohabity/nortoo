import { randomBytes, createHash } from "crypto";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Hash an API key with SHA-256 for database storage/lookup.
 * SHA-256 is sufficient because API keys have 256-bit entropy (unbrute-forceable).
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key for a merchant.
 * Format: "nt_live_" + 32 random hex bytes (71 chars total)
 * Returns both the raw key (shown once to merchant) and its SHA-256 hash (stored in DB).
 */
export function generateApiKey(): { key: string; hash: string } {
  const key = "nt_live_" + randomBytes(32).toString("hex");
  const hash = hashApiKey(key);
  return { key, hash };
}

/**
 * Validate an API key and return the merchant if found.
 * Returns null if the key is invalid or not found.
 * Accepts both nt_live_ (new) and cp_live_ (legacy) prefixes.
 *
 * Lookup: SHA-256 hash-based only (plaintext fallback removed after backfill).
 */
export async function validateApiKey(key: string) {
  if (!key || (!key.startsWith("nt_live_") && !key.startsWith("cp_live_"))) {
    return null;
  }

  const keyHash = hashApiKey(key);

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.apiKeyHash, keyHash))
    .limit(1);

  return merchant ?? null;
}

/**
 * Extract API key from request headers or query params.
 * Checks: x-nortoo-key header first, then x-codpilot-key (legacy), then ?key= query param.
 *
 * @param allowQueryParam - If false, query param fallback is disabled (default: true).
 *   Set to false for custom integration endpoints where header auth is preferred.
 */
export function extractApiKey(
  request: Request,
  { allowQueryParam = true }: { allowQueryParam?: boolean } = {}
): string | null {
  // 1. Check header (new)
  const headerKey = request.headers.get("x-nortoo-key");
  if (headerKey) return headerKey;

  // 2. Check legacy header
  const legacyHeaderKey = request.headers.get("x-codpilot-key");
  if (legacyHeaderKey) return legacyHeaderKey;

  // 3. Check query param (YouCan webhook compat — can't set custom headers)
  if (allowQueryParam) {
    const url = new URL(request.url);
    const paramKey = url.searchParams.get("key");
    if (paramKey) {
      console.warn(
        "[api-key] API key passed via ?key= query param — prefer x-nortoo-key header"
      );
      return paramKey;
    }
  }

  return null;
}
