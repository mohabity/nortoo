"use client";

import { useTranslation } from "@/i18n/provider";
import { DECISION_PILLS } from "@/hooks/use-orders-page";
import type { OrdersCounts } from "@/types/orders";

// ── Decision pills ──

interface DecisionPillsProps {
  currentDecision: string;
  counts: OrdersCounts;
  onFilterChange: (key: string, value: string) => void;
}

export function DecisionPills({
  currentDecision,
  counts,
  onFilterChange,
}: DecisionPillsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
      {DECISION_PILLS.map((pill) => {
        const isActive = currentDecision === pill.key;
        const pillCount = counts[pill.key as keyof OrdersCounts] ?? 0;
        return (
          <button
            key={pill.key}
            onClick={() => onFilterChange("decision", pill.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? pill.activeClass
                : "bg-white border border-silk text-slate hover:bg-snow"
            }`}
          >
            {t(pill.labelKey)}
            <span
              className={`font-mono text-xs ${
                isActive ? "opacity-80" : "text-mist"
              }`}
            >
              ({pillCount})
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Pipeline filter ──

interface PipelineFilterProps {
  currentPipeline: string;
  onFilterChange: (key: string, value: string) => void;
}

export function PipelineFilter({
  currentPipeline,
  onFilterChange,
}: PipelineFilterProps) {
  const { t } = useTranslation();

  return (
    <select
      value={currentPipeline}
      onChange={(e) => onFilterChange("pipeline", e.target.value)}
      className="h-9 min-w-0 flex-1 lg:flex-none rounded-lg border border-silk bg-white px-3 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30"
    >
      <option value="all">{t("orders.filters.pipelineAll")}</option>
      <option value="auto_shipped">{t("orders.filters.autoShipped")}</option>
      <option value="needs_review">{t("orders.filters.toVerify")}</option>
      <option value="escalated">{t("orders.filters.escalated")}</option>
      <option value="auto_blocked">{t("orders.filters.autoBlocked")}</option>
      <option value="merchant_override">{t("orders.filters.override")}</option>
      <option value="pending">{t("orders.filters.pending")}</option>
    </select>
  );
}
