"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import {
  PLAN_CONFIGS,
  FEATURE_LABELS,
  minimumPlanFor,
  type FeatureId,
  type PlanId,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const PLAN_COLORS: Record<PlanId, { bg: string; text: string; btn: string }> = {
  trial: { bg: "bg-slate/5", text: "text-slate", btn: "bg-slate text-white hover:bg-slate/90" },
  starter: { bg: "bg-mint/5", text: "text-mint-deep", btn: "bg-mint text-midnight hover:bg-mint-dark" },
  pro: { bg: "bg-ocean/5", text: "text-ocean", btn: "bg-ocean text-white hover:bg-ocean/90" },
  scale: { bg: "bg-violet/5", text: "text-violet", btn: "bg-violet text-white hover:bg-violet/90" },
};

interface UpgradeBannerProps {
  feature: FeatureId;
  compact?: boolean;
  className?: string;
}

export function UpgradeBanner({
  feature,
  compact = false,
  className,
}: UpgradeBannerProps) {
  const { can } = usePlan();

  // Don't render if the feature is available
  if (can(feature)) return null;

  const requiredPlan = minimumPlanFor(feature);
  const config = PLAN_CONFIGS[requiredPlan];
  const colors = PLAN_COLORS[requiredPlan];
  const featureLabel = FEATURE_LABELS[feature];

  if (compact) {
    return (
      <Link
        href="/dashboard/billing"
        className={cn(
          "inline-flex items-center gap-2 text-xs text-fog hover:text-slate transition-colors group",
          className
        )}
      >
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full text-[0.55rem]",
            colors.bg,
            colors.text
          )}
        >
          ⬆
        </span>
        <span>
          Plan <strong className="text-slate">{config.name}</strong> requis
        </span>
        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-sm border border-silk bg-snow px-5 py-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-sm",
            colors.bg,
            colors.text
          )}
        >
          ⬆
        </div>
        <div>
          <p className="text-sm font-medium text-midnight">
            {featureLabel} nécessite le plan {config.name}
          </p>
          <p className="text-xs text-mist mt-0.5">{config.label}</p>
        </div>
      </div>
      <Link
        href="/dashboard/billing"
        className={cn(
          "shrink-0 rounded-sm px-4 py-2 text-xs font-medium transition-all hover:-translate-y-0.5",
          colors.btn
        )}
      >
        Passer au {config.name} →
      </Link>
    </div>
  );
}
