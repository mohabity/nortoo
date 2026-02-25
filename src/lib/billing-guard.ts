/**
 * Billing Guard — Central paywall enforcement
 *
 * checkBillingState()    → Full billing state for UI + API decisions
 * requireActiveBilling() → Quick guard for mutation API routes (returns 402 if blocked)
 */

import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isTrialExpired } from "@/lib/plans";

// ── Types ────────────────────────────────────────────────

export type BillingState =
  | "active"
  | "trial_active"
  | "trial_expired"
  | "past_due"
  | "cancelled";

export interface BillingCheck {
  state: BillingState;
  canMutate: boolean;
  plan: string;
  billingStatus: string;
  trialEndsAt: Date | null;
}

// ── checkBillingState ────────────────────────────────────

export async function checkBillingState(merchantId: number): Promise<BillingCheck> {
  const [m] = await db
    .select({
      plan: merchants.plan,
      billingStatus: merchants.billingStatus,
      trialEndsAt: merchants.trialEndsAt,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!m) {
    return {
      state: "cancelled",
      canMutate: false,
      plan: "trial",
      billingStatus: "cancelled",
      trialEndsAt: null,
    };
  }

  // Active paid plan
  if (m.billingStatus === "active") {
    return {
      state: "active",
      canMutate: true,
      plan: m.plan,
      billingStatus: m.billingStatus,
      trialEndsAt: m.trialEndsAt,
    };
  }

  // Trial still active
  if (m.billingStatus === "trial" && !isTrialExpired(m.trialEndsAt)) {
    return {
      state: "trial_active",
      canMutate: true,
      plan: m.plan,
      billingStatus: m.billingStatus,
      trialEndsAt: m.trialEndsAt,
    };
  }

  // Trial expired
  if (m.billingStatus === "trial" && isTrialExpired(m.trialEndsAt)) {
    return {
      state: "trial_expired",
      canMutate: false,
      plan: m.plan,
      billingStatus: m.billingStatus,
      trialEndsAt: m.trialEndsAt,
    };
  }

  // Past due
  if (m.billingStatus === "past_due") {
    return {
      state: "past_due",
      canMutate: false,
      plan: m.plan,
      billingStatus: m.billingStatus,
      trialEndsAt: m.trialEndsAt,
    };
  }

  // Cancelled (or unknown)
  return {
    state: "cancelled",
    canMutate: false,
    plan: m.plan,
    billingStatus: m.billingStatus,
    trialEndsAt: m.trialEndsAt,
  };
}

// ── requireActiveBilling ─────────────────────────────────

export interface BillingGuardResult {
  blocked: boolean;
  state: BillingState;
  response?: {
    error: string;
    code: string;
    billingState: BillingState;
  };
  status?: number;
}

/**
 * Quick guard for mutation API routes.
 * Returns { blocked: false } if merchant can mutate,
 * or { blocked: true, response, status: 402 } if paywall active.
 */
export async function requireActiveBilling(
  merchantId: number
): Promise<BillingGuardResult> {
  const billing = await checkBillingState(merchantId);

  if (billing.canMutate) {
    return { blocked: false, state: billing.state };
  }

  const errorMessages: Record<string, string> = {
    trial_expired:
      "Votre essai est terminé. Passez à un plan payant pour continuer.",
    past_due:
      "Facture impayée. Veuillez régler votre facture pour continuer.",
    cancelled: "Votre compte est suspendu.",
  };

  return {
    blocked: true,
    state: billing.state,
    response: {
      error: errorMessages[billing.state] ?? "Compte inactif.",
      code: "BILLING_INACTIVE",
      billingState: billing.state,
    },
    status: 402,
  };
}
