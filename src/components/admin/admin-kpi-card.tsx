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
    <div className="rounded-sm bg-white border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <Icon className={cn("h-5 w-5 text-mint")} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-display font-bold text-midnight">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs font-medium text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
