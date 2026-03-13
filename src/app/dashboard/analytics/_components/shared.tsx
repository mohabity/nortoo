"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { CityAnalytics, SortDir } from "@/types/analytics";
import type { TooltipProps } from "recharts";

// ═══════════════════════════════════════════════════════════
// PERIOD SELECTOR
// ═══════════════════════════════════════════════════════════

export type Period = "7j" | "30j" | "90j";

export function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const { t } = useTranslation();
  const periodLabels: Record<Period, string> = {
    "7j": t("analytics.periods.7d"),
    "30j": t("analytics.periods.30d"),
    "90j": t("analytics.periods.90d"),
  };
  return (
    <div className="flex items-center rounded-sm border border-silk bg-snow/50 p-0.5">
      {(["7j", "30j", "90j"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-xs px-3 py-1.5 text-xs font-medium transition-all",
            value === p
              ? "bg-white text-midnight shadow-sm"
              : "text-fog hover:text-slate"
          )}
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CUSTOM TOOLTIPS
// ═══════════════════════════════════════════════════════════

export const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #E2E8F0",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,.08)",
  padding: "12px 14px",
};

export function RtoTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={tooltipStyle}>
      <p className="font-medium text-midnight text-xs mb-1.5">{d?.fullDate}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-fog inline-block" />
          <span className="text-fog">{t("analytics.charts.orders")}</span>
          <span className="font-mono font-bold text-midnight">{d?.orders}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-mint inline-block" />
          <span className="text-fog">{t("analytics.charts.delivered")}</span>
          <span className="font-mono font-bold text-mint-deep">{d?.delivered}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-rose inline-block" />
          <span className="text-fog">{t("analytics.charts.returns")}</span>
          <span className="font-mono font-bold text-rose">{d?.returns}</span>
        </div>
        <div className="flex items-center gap-2 text-xs border-t border-silk pt-1 mt-1">
          <span className="text-fog">{t("analytics.charts.rtoRate")}</span>
          <span className="font-mono font-bold text-rose">{d?.rtoRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SORTABLE TABLE HEADERS
// ═══════════════════════════════════════════════════════════

export function SortableHeader<T extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: T;
  currentSort: T;
  currentDir: SortDir;
  onSort: (key: T) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-medium text-fog transition-colors hover:text-midnight",
        align === "right" ? "text-right" : "text-left"
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col -space-y-1">
          <ChevronUp
            className={cn("h-2.5 w-2.5", isActive && currentDir === "asc" ? "text-mint" : "text-mist")}
          />
          <ChevronDown
            className={cn("h-2.5 w-2.5", isActive && currentDir === "desc" ? "text-mint" : "text-mist")}
          />
        </span>
      </span>
    </th>
  );
}

// ═══════════════════════════════════════════════════════════
// RTO PROGRESS BAR
// ═══════════════════════════════════════════════════════════

export function RtoBar({ value }: { value: number }) {
  const color =
    value <= 15 ? "bg-mint" : value <= 25 ? "bg-amber" : value <= 40 ? "bg-rose" : "bg-violet";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-snow">
        <div
          className={cn("h-1.5 rounded-full transition-all", color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="font-mono text-xs font-bold text-midnight">{value}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RISK TIER BADGE (Cities)
// ═══════════════════════════════════════════════════════════

export function RiskTierBadge({ tier }: { tier: CityAnalytics["riskTier"] }) {
  const { t } = useTranslation();
  const config: Record<CityAnalytics["riskTier"], { label: string; bg: string; text: string }> = {
    safe: { label: t("analytics.cities.reliable"), bg: "bg-mint-bg", text: "text-mint-deep" },
    moderate: { label: t("analytics.cities.moderate"), bg: "bg-amber-bg", text: "text-amber" },
    risky: { label: t("analytics.cities.risky"), bg: "bg-rose-bg", text: "text-rose" },
    dangerous: { label: t("analytics.cities.dangerous"), bg: "bg-violet-bg", text: "text-violet" },
    unknown: { label: t("analytics.cities.unknown"), bg: "bg-snow", text: "text-fog" },
  };
  const c = config[tier] ?? config.unknown;
  return (
    <span className={cn("inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold", c.bg, c.text)}>
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCT RISK BADGE
// ═══════════════════════════════════════════════════════════

export function ProductRiskBadge({ rtoRate }: { rtoRate: number }) {
  const { t } = useTranslation();
  if (rtoRate > 0.30) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-rose-bg text-rose">
        {t("analytics.products.riskHigh")}
      </span>
    );
  }
  if (rtoRate >= 0.15) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-amber-bg text-amber">
        {t("analytics.products.riskWatch")}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-mint-bg text-mint-deep">
      {t("analytics.products.riskReliable")}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// ZONE RISK BADGE
// ═══════════════════════════════════════════════════════════

export function ZoneRiskBadge({ rtoRate }: { rtoRate: number }) {
  const { t } = useTranslation();
  if (rtoRate > 0.35) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-rose-bg text-rose">
        {t("analytics.zones.riskCritical")}
      </span>
    );
  }
  if (rtoRate > 0.20) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-amber-bg text-amber">
        {t("analytics.zones.riskRisky")}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-mint-bg text-mint-deep">
      {t("analytics.zones.riskReliable")}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }, (_, j) => (
            <div key={j} className="h-4 flex-1 animate-pulse rounded bg-snow" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CAPITALIZE HELPER
// ═══════════════════════════════════════════════════════════

export function capitalize(s: string): string {
  return s.split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
