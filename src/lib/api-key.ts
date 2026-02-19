import { randomBytes } from "crypto";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generate a new API key for a merchant.
 * Format: "cp_live_" + 32 random hex bytes (71 chars total)
 */
export function generateApiKey(): string {
  return "cp_live_" + randomBytes(32).toString("hex");
}

/**
 * Validate an API key and return the merchant if found.
 * Returns null if the key is invalid or not found.
 */
export async function validateApiKey(key: string) {
  if (!key || !key.startsWith("cp_live_")) {
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
 * Checks: x-codpilot-key header first, then ?key= query param.
 */
export function extractApiKey(request: Request): string | null {
  // 1. Check header
  const headerKey = request.headers.get("x-codpilot-key");
  if (headerKey) return headerKey;

  // 2. Check query param
  const url = new URL(request.url);
  const paramKey = url.searchParams.get("key");
  if (paramKey) return paramKey;

  return null;
}
