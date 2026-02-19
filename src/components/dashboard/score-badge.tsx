import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function scoreColor(score: number) {
  if (score <= 30) return "bg-mint/15 text-mint-deep";
  if (score <= 65) return "bg-sun-light text-sun-deep";
  if (score <= 85) return "bg-coral-light text-terra";
  return "bg-violet-light text-violet";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-bold rounded-xs",
        scoreColor(score),
        sizeClasses[size]
      )}
    >
      {score}
    </span>
  );
}
