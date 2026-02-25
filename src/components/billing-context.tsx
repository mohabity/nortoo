"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type BillingState =
  | "active"
  | "trial_active"
  | "trial_expired"
  | "past_due"
  | "cancelled"
  | "loading";

interface BillingContextValue {
  /** Whether the merchant can perform mutations (overrides, settings, team, etc.) */
  canMutate: boolean;
  /** Current billing state */
  billingState: BillingState;
  /** Current plan ID */
  plan: string;
  /** Whether data is still loading */
  loading: boolean;
}

const BillingContext = createContext<BillingContextValue>({
  canMutate: true,
  billingState: "loading",
  plan: "trial",
  loading: true,
});

export function useBilling() {
  return useContext(BillingContext);
}

/**
 * BillingProvider — fetches /api/settings/plan once on mount
 * and exposes canMutate + billingState to all dashboard children.
 */
export function BillingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BillingContextValue>({
    canMutate: true,
    billingState: "loading",
    plan: "trial",
    loading: true,
  });

  useEffect(() => {
    fetch("/api/settings/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.data) {
          setState((s) => ({ ...s, loading: false }));
          return;
        }

        const data = json.data;
        const billingStatus = data.billingStatus ?? "trial";
        const plan = data.plan ?? "trial";

        // Determine billing state
        let billingState: BillingState = "active";
        if (billingStatus === "past_due") {
          billingState = "past_due";
        } else if (billingStatus === "cancelled") {
          billingState = "cancelled";
        } else if (plan === "trial" && data.trial) {
          billingState = data.trial.daysRemaining > 0 ? "trial_active" : "trial_expired";
        } else if (billingStatus === "active") {
          billingState = "active";
        }

        const canMutate =
          billingState === "active" || billingState === "trial_active";

        setState({ canMutate, billingState, plan, loading: false });
      })
      .catch(() => {
        setState((s) => ({ ...s, loading: false }));
      });
  }, []);

  return (
    <BillingContext.Provider value={state}>{children}</BillingContext.Provider>
  );
}
