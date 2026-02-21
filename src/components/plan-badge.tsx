"use client";

import { cn } from "@/lib/utils";
import { type PlanId, PLAN_LABELS } from "@/lib/plans";

const PLAN_COLORS: Record<PlanId, { bg: string; text: string }> = {
  trial: { bg: "bg-sun/15", text: "text-sun-deep" },
  starter: { bg: "bg-mint/15", text: "text-mint-deep" },
  pro: { bg: "bg-ocean/15", text: "text-ocean" },
  scale: { bg: "bg-violet/15", text: "text-violet" },
};

interface PlanBadgeProps {
  plan: string;
  className?: string;
}

/**
 * Small colored badge showing the plan name.
 * Used in header, billing tab, etc.
 */
export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const planId = plan as PlanId;
  const colors = PLAN_COLORS[planId] ?? PLAN_COLORS.trial;
  const label = PLAN_LABELS[planId] ?? plan;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        colors.bg,
        colors.text,
        className
      )}
    >
      {label}
    </span>
  );
}
