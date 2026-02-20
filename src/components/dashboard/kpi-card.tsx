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
  iconColor = "text-mint",
}: KpiCardProps) {
  return (
    <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-fog">{title}</p>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-display font-bold text-midnight">{value}</p>
        {change && (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              changeType === "positive" && "text-mint-deep",
              changeType === "negative" && "text-rose",
              changeType === "neutral" && "text-fog"
            )}
          >
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
