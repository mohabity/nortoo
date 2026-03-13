"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MapPin,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { ZoneAnalytics, ZoneSortKey, SortDir } from "@/types/analytics";
import { SortableHeader, RtoBar, ZoneRiskBadge, TableSkeleton, capitalize } from "./shared";

interface ZonesSectionProps {
  zoneData: ZoneAnalytics[];
  sortedZones: ZoneAnalytics[];
  zoneLoading: boolean;
  zoneError: string | null;
  zoneSort: ZoneSortKey;
  zoneSortDir: SortDir;
  handleZoneSort: (key: ZoneSortKey) => void;
  zoneCities: string[];
  zoneCityFilter: string;
  setZoneCityFilter: (city: string) => void;
  criticalZones: number;
  safeZones: number;
}

export function ZonesSection({
  zoneData,
  sortedZones,
  zoneLoading,
  zoneError,
  zoneSort,
  zoneSortDir,
  handleZoneSort,
  zoneCities,
  zoneCityFilter,
  setZoneCityFilter,
  criticalZones,
  safeZones,
}: ZonesSectionProps) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-ocean" />
              <CardTitle>{t("analytics.zones.title")}</CardTitle>
            </div>
            <p className="text-xs text-fog mt-1">
              {t("analytics.zones.subtitle")}
            </p>
          </div>
          {/* City filter */}
          {!zoneLoading && zoneCities.length > 0 && (
            <select
              value={zoneCityFilter}
              onChange={(e) => setZoneCityFilter(e.target.value)}
              className="rounded-sm border border-silk bg-white px-3 py-2 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint min-h-[44px]"
            >
              <option value="">{t("analytics.zones.allCities")}</option>
              {zoneCities.map((city) => (
                <option key={city} value={city}>{capitalize(city)}</option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Zone mini KPIs */}
        {zoneLoading ? (
          <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[200px] snap-start lg:min-w-0 h-20 animate-pulse rounded-xl bg-snow" />
            ))}
          </div>
        ) : zoneError ? null : (
          <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
            <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ocean" />
                <p className="text-xs font-medium text-fog">{t("analytics.zones.tracked")}</p>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-midnight">
                {zoneData.length}
              </p>
              <p className="text-[11px] text-fog">
                {t("analytics.zones.trackedSubtitle")}
              </p>
            </div>

            <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose" />
                <p className="text-xs font-medium text-fog">{t("analytics.zones.critical")}</p>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-midnight">
                {criticalZones}
              </p>
              <p className="text-[11px] text-fog">
                {t("analytics.zones.criticalCriteria")}
              </p>
            </div>

            <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-mint-deep" />
                <p className="text-xs font-medium text-fog">{t("analytics.zones.reliable")}</p>
              </div>
              <p className="mt-2 font-display text-xl font-bold text-midnight">
                {safeZones}
              </p>
              <p className="text-[11px] text-fog">
                {t("analytics.zones.reliableCriteria")}
              </p>
            </div>
          </div>
        )}

        {/* Zone table */}
        {zoneLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : zoneError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-rose mb-3" />
            <p className="text-sm font-medium text-midnight">{t("analytics.products.loadError")}</p>
            <p className="text-xs text-fog mt-1">{zoneError}</p>
          </div>
        ) : zoneData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-8 w-8 text-fog mb-3" />
            <p className="text-sm font-medium text-midnight">{t("analytics.zones.noData")}</p>
            <p className="text-xs text-fog mt-1">{t("analytics.zones.noDataHint")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-silk">
                    <SortableHeader<ZoneSortKey> label={t("analytics.zones.city")} sortKey="city" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} />
                    <SortableHeader<ZoneSortKey> label={t("analytics.zones.zone")} sortKey="zone" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} />
                    <SortableHeader<ZoneSortKey> label={t("analytics.zones.orders")} sortKey="totalOrders" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                    <SortableHeader<ZoneSortKey> label={t("analytics.zones.delivered")} sortKey="deliveredOrders" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                    <SortableHeader<ZoneSortKey> label={t("analytics.zones.returns")} sortKey="returnedOrders" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                    <SortableHeader<ZoneSortKey> label={t("analytics.zones.rtoRate")} sortKey="rtoRate" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                    <SortableHeader<ZoneSortKey> label={t("analytics.zones.avgScore")} sortKey="avgScore" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedZones.map((z) => (
                    <tr key={z.id} className="border-b border-silk/50 transition-colors hover:bg-snow/30">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-midnight">{capitalize(z.city)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate">{capitalize(z.zone)}</span>
                          <ZoneRiskBadge rtoRate={z.rtoRate} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-slate">{z.totalOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-mint-deep">{z.deliveredOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-rose">{z.returnedOrders}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RtoBar value={Math.round(z.rtoRate * 100)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                            z.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                            z.avgScore > 30 && z.avgScore <= 65 && "bg-amber-bg text-amber",
                            z.avgScore > 65 && z.avgScore <= 85 && "bg-rose-bg text-rose",
                            z.avgScore > 85 && "bg-violet-bg text-violet"
                          )}
                        >
                          {Math.round(z.avgScore)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {sortedZones.map((z) => (
                <div key={z.id} className="rounded-sm border border-silk bg-white p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-body text-sm font-semibold text-midnight">{capitalize(z.zone)}</p>
                      <p className="text-xs text-fog mt-0.5">{capitalize(z.city)}</p>
                    </div>
                    <ZoneRiskBadge rtoRate={z.rtoRate} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-fog">{t("analytics.zones.rtoRate")}</span>
                      <RtoBar value={Math.round(z.rtoRate * 100)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-t border-silk pt-3">
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.zones.orders")}</p>
                      <p className="font-mono text-sm font-bold text-slate">{z.totalOrders}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.zones.delivered")}</p>
                      <p className="font-mono text-sm font-bold text-mint-deep">{z.deliveredOrders}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-fog">{t("analytics.zones.returns")}</p>
                      <p className="font-mono text-sm font-bold text-rose">{z.returnedOrders}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[11px] text-fog">{t("analytics.zones.avgScore")}</p>
                      <span
                        className={cn(
                          "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                          z.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                          z.avgScore > 30 && z.avgScore <= 65 && "bg-amber-bg text-amber",
                          z.avgScore > 65 && z.avgScore <= 85 && "bg-rose-bg text-rose",
                          z.avgScore > 85 && "bg-violet-bg text-violet"
                        )}
                      >
                        {Math.round(z.avgScore)}
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
