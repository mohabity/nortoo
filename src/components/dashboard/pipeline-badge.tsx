import { cn } from "@/lib/utils";

interface PipelineBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const pipelineConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: "En attente", classes: "bg-sand text-ink-3" },
  auto_shipped: { label: "Auto-expédié", classes: "bg-mint/15 text-mint-deep" },
  needs_review: { label: "À vérifier", classes: "bg-sun-light text-sun-deep" },
  escalated: { label: "Escaladé", classes: "bg-coral-light text-terra" },
  auto_blocked: { label: "Auto-bloqué", classes: "bg-violet-light text-violet" },
  merchant_override: { label: "Override", classes: "bg-ocean-light text-ocean" },
};

export function PipelineBadge({ status, size = "md" }: PipelineBadgeProps) {
  const config = pipelineConfig[status] ?? {
    label: status,
    classes: "bg-sand text-ink-3",
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
