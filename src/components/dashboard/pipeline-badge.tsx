import { cn } from "@/lib/utils";

interface PipelineBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const pipelineConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: "En attente", classes: "bg-snow text-fog" },
  auto_shipped: { label: "Auto-expédié", classes: "bg-mint/15 text-mint-deep" },
  needs_review: { label: "À vérifier", classes: "bg-amber-bg text-amber" },
  escalated: { label: "Escaladé", classes: "bg-rose-bg text-rose" },
  auto_blocked: { label: "Auto-bloqué", classes: "bg-violet-bg text-violet" },
  merchant_override: { label: "Override", classes: "bg-ocean-bg text-ocean" },
};

export function PipelineBadge({ status, size = "md" }: PipelineBadgeProps) {
  const config = pipelineConfig[status] ?? {
    label: status,
    classes: "bg-snow text-fog",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-xs",
        size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2.5 py-0.5",
        config.classes
      )}
    >
      {config.label}
    </span>
  );
}
