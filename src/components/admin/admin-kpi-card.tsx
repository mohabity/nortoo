import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface AdminKpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}

export function AdminKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: AdminKpiCardProps) {
  return (
    <div className="rounded-sm bg-slate/30 border border-slate p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-mist">{title}</p>
        <Icon className={cn("h-5 w-5 text-[#C8FF00]")} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs font-medium text-fog">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
