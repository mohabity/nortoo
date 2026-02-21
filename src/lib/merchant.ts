import { cookies } from "next/headers";
import { auth } from "@/auth";

// Fallback for seed data / testing
export const DEMO_MERCHANT_ID = 1;

/**
 * Read the authenticated merchant ID from the Auth.js session.
 * Falls back to the legacy nortoo_merchant cookie (YouCan OAuth compat),
 * then to DEMO_MERCHANT_ID if nothing is found.
 */
export async function getMerchantId(): Promise<number> {
  // 1. Try Auth.js session first
  try {
    const session = await auth();
    if (session?.user?.merchantId) return session.user.merchantId;
  } catch {
    // auth() may fail in some contexts, fall through
  }

  // 2. Fallback: legacy cookie (YouCan OAuth backward compat)
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("nortoo_merchant")?.value;
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // cookies() may fail in some contexts, fall through
  }

  return DEMO_MERCHANT_ID;
}

/**
 * Get both merchantId and plan from the session.
 * The plan is cached in the JWT — for security-critical checks,
 * always verify against the DB (server-side gating does this).
 */
export async function getMerchantContext(): Promise<{
  merchantId: number;
  plan: string;
}> {
  try {
    const session = await auth();
    if (session?.user?.merchantId) {
      return {
        merchantId: session.user.merchantId,
        plan: session.user.plan ?? "trial",
      };
    }
  } catch {
    // fall through
  }

  // Fallback
  const merchantId = await getMerchantId();
  return { merchantId, plan: "trial" };
}
