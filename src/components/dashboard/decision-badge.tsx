import { cn } from "@/lib/utils";

interface DecisionBadgeProps {
  decision: string;
  size?: "sm" | "md";
}

const decisionConfig: Record<string, { label: string; classes: string }> = {
  ship: { label: "Expédier", classes: "bg-mint/15 text-mint-deep" },
  verify: { label: "Vérifier", classes: "bg-sun-light text-sun-deep" },
  flag: { label: "Signaler", classes: "bg-coral-light text-terra" },
  block: { label: "Bloquer", classes: "bg-violet-light text-violet" },
};

export function DecisionBadge({ decision, size = "md" }: DecisionBadgeProps) {
  const config = decisionConfig[decision] ?? {
    label: decision,
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
