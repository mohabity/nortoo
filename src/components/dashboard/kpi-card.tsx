import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-sun",
}: KpiCardProps) {
  return (
    <div className="rounded bg-white border border-border shadow-[0_2px_8px_rgba(0,0,0,.06)] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-3">{title}</p>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-sora font-bold text-ink-1">{value}</p>
        {change && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              changeType === "positive" && "text-mint-deep",
              changeType === "negative" && "text-coral",
              changeType === "neutral" && "text-ink-3"
            )}
          >
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
