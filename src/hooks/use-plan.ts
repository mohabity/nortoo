"use client";

import { useSession } from "next-auth/react";
import {
  getPlanConfig,
  hasFeature,
  type PlanId,
  type FeatureId,
  type PlanConfig,
} from "@/lib/plans";

/**
 * Client-side hook to access the current user's plan info.
 * Plan is cached in the JWT — server-side is the real authority.
 */
export function usePlan() {
  const { data: session } = useSession();
  const plan = (session?.user?.plan ?? "trial") as PlanId;
  const config = getPlanConfig(plan);

  return {
    /** Current plan ID */
    plan,
    /** Full plan config (name, price, features, limits) */
    config,
    /** Check if current plan includes a feature */
    can: (feature: FeatureId): boolean => hasFeature(plan, feature),
  };
}

export type UsePlanReturn = ReturnType<typeof usePlan>;
