import { cookies } from "next/headers";

// Fallback for seed data / testing
export const DEMO_MERCHANT_ID = 1;

/**
 * Read the authenticated merchant ID from the codpilot_merchant cookie.
 * Falls back to DEMO_MERCHANT_ID if cookie is missing (shouldn't happen
 * because middleware blocks unauthenticated requests).
 */
export async function getMerchantId(): Promise<number> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("codpilot_merchant")?.value;

  if (raw) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return DEMO_MERCHANT_ID;
}
