"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

interface PipelineBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const pipelineClasses: Record<string, string> = {
  pending: "bg-snow text-fog",
  auto_shipped: "bg-mint/15 text-mint-deep",
  needs_review: "bg-amber-bg text-amber",
  escalated: "bg-rose-bg text-rose",
  auto_blocked: "bg-violet-bg text-violet",
  merchant_override: "bg-ocean-bg text-ocean",
};

export function PipelineBadge({ status, size = "md" }: PipelineBadgeProps) {
  const { t } = useTranslation();

  const classes = pipelineClasses[status] ?? "bg-snow text-fog";
  const label = t(`pipeline.${status}`);

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
