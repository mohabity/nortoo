"use client";

import { type ReactNode } from "react";
import { Lock } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import {
  minimumPlanFor,
  type FeatureId,
} from "@/lib/plans";
import Link from "next/link";
import { useTranslation } from "@/i18n/provider";

interface FeatureGateProps {
  /** Feature to check */
  feature: FeatureId;
  /** How to handle gated content:
   * - "hide" — don't render children at all
   * - "lock" — show children with a lock overlay (default)
   * - "upgrade" — show an upgrade CTA instead of children
   */
  mode?: "hide" | "lock" | "upgrade";
  /** Children to render if feature is available */
  children: ReactNode;
  /** Optional custom message */
  message?: string;
}

/**
 * Client-side feature gate component.
 * Wraps content that requires a specific plan feature.
 *
 * Usage:
 *   <FeatureGate feature="csv_export">
 *     <ExportButton />
 *   </FeatureGate>
 */
export function FeatureGate({
  feature,
  mode = "lock",
  children,
  message,
}: FeatureGateProps) {
  const { can } = usePlan();
  const { t } = useTranslation();

  if (can(feature)) {
    return <>{children}</>;
  }

  const requiredPlan = minimumPlanFor(feature);
  const planLabel = t(`plans.${requiredPlan}.name`);
  const featureLabel = t(`features.${feature}`);
  const defaultMessage = t("components.featureGate.requiresPlan", {
    feature: featureLabel,
    plan: planLabel,
  });
  const displayMessage = message ?? defaultMessage;

  if (mode === "hide") {
    return null;
  }

  if (mode === "upgrade") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-sm border border-silk bg-snow p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mist/10">
          <Lock className="h-5 w-5 text-mist" />
        </div>
        <p className="text-sm text-fog">{displayMessage}</p>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 rounded-sm bg-mint px-4 py-2 text-sm font-medium text-midnight transition-colors hover:bg-mint-dark"
        >
          {t("components.featureGate.viewPlans")}
        </Link>
      </div>
    );
  }

  // mode === "lock" — show children with overlay
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40 blur-[1px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-sm bg-white/90 px-4 py-2 shadow-sm border border-silk">
          <Lock className="h-4 w-4 text-mist" />
          <span className="text-xs font-medium text-fog">
            {t("components.featureGate.planBadge", { plan: planLabel })}
          </span>
        </div>
      </div>
    </div>
  );
}
