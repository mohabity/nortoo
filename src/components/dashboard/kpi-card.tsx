import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  tooltipKey?: string;
  guideSection?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-mint",
  tooltipKey,
  guideSection,
}: KpiCardProps) {
  return (
    <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-fog">{title}</p>
          {tooltipKey && <HelpTooltip textKey={tooltipKey} guideSection={guideSection} />}
        </div>
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
