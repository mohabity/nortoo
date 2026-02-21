import { randomBytes } from "crypto";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a new API key for a merchant.
 * Format: "nt_live_" + 32 random hex bytes (71 chars total)
 */
export function generateApiKey(): string {
  return "nt_live_" + randomBytes(32).toString("hex");
}

/**
 * Validate an API key and return the merchant if found.
 * Returns null if the key is invalid or not found.
 * Accepts both nt_live_ (new) and cp_live_ (legacy) prefixes.
 */
export async function validateApiKey(key: string) {
  if (!key || (!key.startsWith("nt_live_") && !key.startsWith("cp_live_"))) {
    return null;
  }

  const [merchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.apiKey, key))
    .limit(1);

  return merchant ?? null;
}

/**
 * Extract API key from request headers or query params.
 * Checks: x-nortoo-key header first, then x-codpilot-key (legacy), then ?key= query param.
 */
export function extractApiKey(request: Request): string | null {
  // 1. Check header (new)
  const headerKey = request.headers.get("x-nortoo-key");
  if (headerKey) return headerKey;

  // 2. Check legacy header
  const legacyHeaderKey = request.headers.get("x-codpilot-key");
  if (legacyHeaderKey) return legacyHeaderKey;

  // 3. Check query param
  const url = new URL(request.url);
  const paramKey = url.searchParams.get("key");
  if (paramKey) return paramKey;

  return null;
}
