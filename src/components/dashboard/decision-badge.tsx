"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

interface DecisionBadgeProps {
  decision: string;
  size?: "sm" | "md";
}

const decisionClasses: Record<string, string> = {
  ship: "bg-mint/15 text-mint-deep",
  verify: "bg-amber-bg text-amber",
  flag: "bg-rose-bg text-rose",
  block: "bg-violet-bg text-violet",
};

export function DecisionBadge({ decision, size = "md" }: DecisionBadgeProps) {
  const { t } = useTranslation();

  const classes = decisionClasses[decision] ?? "bg-snow text-fog";
  const label = t(`decisions.${decision}`);

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-xs",
        size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2.5 py-0.5",
        classes
      )}
    >
      {label}
    </span>
  );
}
