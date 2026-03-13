"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { CityAnalytics, CitySortKey, SortDir } from "@/types/analytics";
import { SortableHeader, RtoBar, RiskTierBadge, TableSkeleton } from "./shared";

interface CitiesSectionProps {
  cityData: CityAnalytics[];
  sortedCities: CityAnalytics[];
  cityLoading: boolean;
  cityError: string | null;
  citySort: CitySortKey;
  citySortDir: SortDir;
  handleCitySort: (key: CitySortKey) => void;
}

export function CitiesSection({
  cityData,
  sortedCities,
  cityLoading,
  cityError,
  citySort,
  citySortDir,
  handleCitySort,
}: CitiesSectionProps) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("analytics.cities.title")}</CardTitle>
            <p className="text-xs text-fog">{t("analytics.cities.subtitle")}</p>
          </div>
          {!cityLoading && !cityError && cityData.length > 0 && (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium",
              cityData.some((c) => c.riskTier !== "unknown")
                ? "bg-mint-bg text-mint-deep"
                : "bg-snow text-fog"
            )}>
              {cityData.some((c) => c.riskTier !== "unknown") ? t("analytics.cities.realData") : t("analytics.cities.estimate")}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cityLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : cityError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-rose mb-3" />
            <p className="text-sm font-medium text-midnight">{t("analytics.products.loadError")}</p>
            <p className="text-xs text-fog mt-1">{cityError}</p>
          </div>
        ) : cityData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-8 w-8 text-fog mb-3" />
            <p className="text-sm font-medium text-midnight">{t("analytics.cities.noData")}</p>
            <p className="text-xs text-fog mt-1">{t("analytics.products.noProductsHint")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-silk">
                    <SortableHeader<CitySortKey> label={t("analytics.cities.city")} sortKey="cityDisplay" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} />
                    <SortableHeader<CitySortKey> label={t("analytics.cities.orders")} sortKey="totalOrders" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                    <SortableHeader<CitySortKey> label={t("analytics.cities.delivered")} sortKey="deliveredOrders" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                    <SortableHeader<CitySortKey> label={t("analytics.cities.returns")} sortKey="returnedOrders" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                    <SortableHeader<CitySortKey> label={t("analytics.cities.rtoRate")} sortKey="rtoRate" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                    <SortableHeader<CitySortKey> label={t("analytics.cities.avgScore")} sortKey="avgScore" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                    <SortableHeader<CitySortKey> label={t("analytics.cities.risk")} sortKey="riskTier" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedCities.map((c) => (
                    <tr key={c.id} className="border-b border-silk/50 transition-colors hover:bg-snow/30">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-midnight">{c.cityDisplay}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-slate">{c.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-mint-deep">{c.deliveredOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-rose">{c.returnedOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RtoBar value={Math.round(c.rtoRate * 100)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                            c.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                            c.avgScore > 30 && c.avgScore <= 65 && "bg-amber-bg text-amber",
                            c.avgScore > 65 && c.avgScore <= 85 && "bg-rose-bg text-rose",
                            c.avgScore > 85 && "bg-violet-bg text-violet"
                          )}
                        >
                          {c.avgScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RiskTierBadge tier={c.riskTier} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {sortedCities.map((c) => (
                <div key={c.id} className="rounded-sm border border-silk bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-body text-sm font-semibold text-midnight">{c.cityDisplay}</p>
                    <RiskTierBadge tier={c.riskTier} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-fog">{t("analytics.cities.rtoRate")}</span>
                      <RtoBar value={Math.round(c.rtoRate * 100)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t border-silk pt-3">
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.cities.orders")}</p>
                      <p className="font-mono text-sm font-bold text-slate">{c.totalOrders}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.cities.delivered")}</p>
                      <p className="font-mono text-sm font-bold text-mint-deep">{c.deliveredOrders}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.cities.returns")}</p>
                      <p className="font-mono text-sm font-bold text-rose">{c.returnedOrders}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[11px] text-fog">{t("analytics.cities.avgScore")}</p>
                      <span
                        className={cn(
                          "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                          c.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                          c.avgScore > 30 && c.avgScore <= 65 && "bg-amber-bg text-amber",
                          c.avgScore > 65 && c.avgScore <= 85 && "bg-rose-bg text-rose",
                          c.avgScore > 85 && "bg-violet-bg text-violet"
                        )}
                      >
                        {c.avgScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
