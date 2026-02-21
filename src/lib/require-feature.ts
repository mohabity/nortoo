/**
 * Server-side feature gating.
 * Use in API routes after auth to enforce plan-based access.
 *
 * Pattern:
 *   const plan = ctx.plan ?? "trial";
 *   requireFeature(plan, "csv_export");
 *   // ... continue if allowed
 *
 * Throws FeatureGateError → catch with handleFeatureGateError()
 */

import { NextResponse } from "next/server";
import {
  hasFeature,
  minimumPlanFor,
  getBulkLimit,
  type FeatureId,
  PLAN_LABELS,
  type PlanId,
} from "@/lib/plans";

export class FeatureGateError extends Error {
  feature: FeatureId;
  currentPlan: string;
  requiredPlan: PlanId;

  constructor(feature: FeatureId, currentPlan: string) {
    const requiredPlan = minimumPlanFor(feature);
    const requiredLabel = PLAN_LABELS[requiredPlan] ?? requiredPlan;
    super(
      `Cette fonctionnalité nécessite le plan ${requiredLabel} ou supérieur.`
    );
    this.name = "FeatureGateError";
    this.feature = feature;
    this.currentPlan = currentPlan;
    this.requiredPlan = requiredPlan;
  }
}

/**
 * Throws FeatureGateError if the plan doesn't include the feature.
 */
export function requireFeature(plan: string, feature: FeatureId): void {
  if (!hasFeature(plan, feature)) {
    throw new FeatureGateError(feature, plan);
  }
}

/**
 * Catch FeatureGateError and return a 403 response.
 * For other errors, rethrow.
 */
export function handleFeatureGateError(
  err: unknown
): NextResponse | never {
  if (err instanceof FeatureGateError) {
    return NextResponse.json(
      {
        error: err.message,
        code: "PLAN_REQUIRED",
        requiredPlan: err.requiredPlan,
        feature: err.feature,
      },
      { status: 403 }
    );
  }
  throw err;
}

/**
 * Check bulk batch limit for a plan.
 * Returns the effective limit (0 = unlimited).
 * Throws FeatureGateError if bulk_actions not available.
 */
export function requireBulkAccess(
  plan: string,
  requestedCount: number
): { effectiveLimit: number } {
  requireFeature(plan, "bulk_actions");
  const limit = getBulkLimit(plan);
  if (limit > 0 && requestedCount > limit) {
    const planLabel = PLAN_LABELS[plan as PlanId] ?? plan;
    throw new BulkLimitError(requestedCount, limit, planLabel);
  }
  return { effectiveLimit: limit };
}

export class BulkLimitError extends Error {
  requested: number;
  limit: number;

  constructor(requested: number, limit: number, planLabel: string) {
    super(
      `Votre plan ${planLabel} est limité à ${limit} commandes par lot. Vous en avez sélectionné ${requested}.`
    );
    this.name = "BulkLimitError";
    this.requested = requested;
    this.limit = limit;
  }
}
