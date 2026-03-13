"use client";

import {
  Coins,
  TrendingDown,
  Truck,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency, formatNumber } from "@/lib/i18n-utils";
import type { SavingsApiData } from "@/types/analytics";

interface KpiCardsProps {
  savingsData: SavingsApiData | null;
  savings: number;
  savingsChange: number;
  rtoRate: number;
  rtoDelta: number;
  baseline: number;
  deliveryRate: number;
  totalDelivered: number;
  roiDisplay: string;
}

export function KpiCards({
  savingsData,
  savings,
  savingsChange,
  rtoRate,
  rtoDelta,
  baseline,
  deliveryRate,
  totalDelivered,
  roiDisplay,
}: KpiCardsProps) {
  const { t, locale } = useTranslation();

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-4">
      {/* Economies estimees */}
      <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-fog">{t("analytics.kpi.savings")}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-bg">
            <Coins className="h-4.5 w-4.5 text-amber" />
          </div>
        </div>
        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-midnight">
            {formatCurrency(savings, locale)}
          </p>
          <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", savingsChange >= 0 ? "text-mint-deep" : "text-rose")}>
            {savingsChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {savingsChange >= 0 ? "+" : ""}{savingsChange}% {t("analytics.kpi.vsPreviousPeriod")}
          </p>
        </div>
      </div>

      {/* Taux RTO actuel */}
      <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-fog">{t("analytics.kpi.rtoRate")}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-rose-bg">
            <TrendingDown className="h-4.5 w-4.5 text-rose" />
          </div>
        </div>
        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-midnight">
            {savingsData?.rtoRate ?? rtoRate}<span className="text-base font-semibold text-fog">%</span>
          </p>
          {savingsData ? (
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", savingsData.rtoRateDelta <= 0 ? "text-mint-deep" : "text-rose")}>
              {savingsData.rtoRateDelta <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              {savingsData.rtoRateDelta > 0 ? "+" : ""}{savingsData.rtoRateDelta} {t("analytics.kpi.ptsVsPreviousPeriod")}
            </p>
          ) : (
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", rtoDelta <= 0 ? "text-mint-deep" : "text-rose")}>
              {rtoDelta <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              {rtoDelta} {t("analytics.kpi.ptsVsBaseline")} ({baseline}%)
            </p>
          )}
        </div>
      </div>

      {/* Taux de livraison */}
      <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-fog">{t("analytics.kpi.deliveryRate")}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-mint-bg">
            <Truck className="h-4.5 w-4.5 text-mint-deep" />
          </div>
        </div>
        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-midnight">
            {savingsData?.deliveryRate ?? deliveryRate}<span className="text-base font-semibold text-fog">%</span>
          </p>
          {savingsData ? (
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", savingsData.deliveryRateDelta >= 0 ? "text-mint-deep" : "text-rose")}>
              {savingsData.deliveryRateDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {savingsData.deliveryRateDelta >= 0 ? "+" : ""}{savingsData.deliveryRateDelta} {t("analytics.kpi.ptsVsPreviousPeriod")}
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-mint-deep">
              <ArrowUpRight className="h-3 w-3" />
              {formatNumber(totalDelivered, locale)} {t("analytics.kpi.deliveredOrders")}
            </p>
          )}
        </div>
      </div>

      {/* ROI nortoo */}
      <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-fog">{t("analytics.kpi.roi")}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-violet-bg">
            <Flame className="h-4.5 w-4.5 text-violet" />
          </div>
        </div>
        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-midnight">{roiDisplay}</p>
          {savingsData?.roiDelta != null ? (
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", savingsData.roiDelta >= 0 ? "text-mint-deep" : "text-rose")}>
              {savingsData.roiDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {savingsData.roiDelta >= 0 ? "+" : ""}{savingsData.roiDelta}× {t("analytics.kpi.vsPreviousPeriod")}
            </p>
          ) : (
            <p className="mt-1 text-xs font-medium text-fog">
              {savingsData?.projectedMonthlySaved
                ? `${formatNumber(savingsData.projectedMonthlySaved, locale)} ${t("analytics.kpi.projectedMonthly")}`
                : "\u2014"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
