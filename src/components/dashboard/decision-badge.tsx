import { cn } from "@/lib/utils";

interface DecisionBadgeProps {
  decision: string;
  size?: "sm" | "md";
}

const decisionConfig: Record<string, { label: string; classes: string }> = {
  ship: { label: "Expédier", classes: "bg-mint/15 text-mint-deep" },
  verify: { label: "Vérifier", classes: "bg-amber-bg text-amber" },
  flag: { label: "Signaler", classes: "bg-rose-bg text-rose" },
  block: { label: "Bloquer", classes: "bg-violet-bg text-violet" },
};

export function DecisionBadge({ decision, size = "md" }: DecisionBadgeProps) {
  const config = decisionConfig[decision] ?? {
    label: decision,
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
