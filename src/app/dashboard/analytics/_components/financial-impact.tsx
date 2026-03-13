"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency } from "@/lib/i18n-utils";
import type { SavingsApiData } from "@/types/analytics";

interface FinancialImpactProps {
  savingsData: SavingsApiData;
}

export function FinancialImpact({ savingsData }: FinancialImpactProps) {
  const { t, locale } = useTranslation();

  return (
    <Card className="rounded-[18px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber" />
          <CardTitle>{t("analytics.financial.title")}</CardTitle>
        </div>
        <p className="text-xs text-fog">{t("analytics.financial.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mini KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-silk bg-snow/50 p-4">
            <p className="text-xs font-medium text-fog">{t("analytics.financial.avoidedOrders")}</p>
            <p className="mt-2 font-display text-xl font-bold text-midnight">
              {savingsData.ordersSaved}
            </p>
          </div>
          <div className="rounded-xl border border-silk bg-snow/50 p-4">
            <p className="text-xs font-medium text-fog">{t("analytics.financial.avgSavedPerOrder")}</p>
            <p className="mt-2 font-display text-xl font-bold text-midnight">
              {formatCurrency(savingsData.avgSavedPerOrder, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-silk bg-snow/50 p-4">
            <p className="text-xs font-medium text-fog">{t("analytics.financial.projectedMonthly")}</p>
            <p className="mt-2 font-display text-xl font-bold text-midnight">
              {formatCurrency(savingsData.projectedMonthlySaved, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-silk bg-snow/50 p-4">
            <p className="text-xs font-medium text-fog">{t("analytics.financial.roi")}</p>
            <p className="mt-2 font-display text-xl font-bold text-midnight">
              {savingsData.roiMultiple ? `${savingsData.roiMultiple}\u00d7` : "\u2014"}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div>
          <p className="text-sm font-medium text-midnight mb-3">{t("analytics.financial.breakdown")}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-sm bg-snow px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet" />
                <span className="text-sm text-slate">{t("analytics.financial.autoBlocked")}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-fog">{savingsData.breakdown.autoBlocked.count} {t("analytics.financial.orderCount")}</span>
                <span className="font-mono text-sm font-bold text-midnight">
                  {formatCurrency(savingsData.breakdown.autoBlocked.amount, locale)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-sm bg-snow px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose" />
                <span className="text-sm text-slate">{t("analytics.financial.merchantBlocked")}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-fog">{savingsData.breakdown.merchantBlocked.count} {t("analytics.financial.orderCount")}</span>
                <span className="font-mono text-sm font-bold text-midnight">
                  {formatCurrency(savingsData.breakdown.merchantBlocked.amount, locale)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-sm bg-snow px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber" />
                <span className="text-sm text-slate">{t("analytics.financial.flaggedEscalated")}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-fog">{savingsData.breakdown.flaggedNotShipped.count} {t("analytics.financial.orderCount")}</span>
                <span className="font-mono text-sm font-bold text-midnight">
                  {formatCurrency(savingsData.breakdown.flaggedNotShipped.amount, locale)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top products & cities */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top products by savings */}
          {savingsData.topProducts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-midnight mb-3">{t("analytics.financial.topProducts")}</p>
              <div className="space-y-1.5">
                {savingsData.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-sm bg-snow px-3 py-2">
                    <span className="text-sm text-slate truncate max-w-[60%]">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-fog">{p.count} {t("analytics.financial.cmd")}</span>
                      <span className="font-mono text-sm font-bold text-midnight">
                        {formatCurrency(p.saved, locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top cities by savings */}
          {savingsData.topCities.length > 0 && (
            <div>
              <p className="text-sm font-medium text-midnight mb-3">{t("analytics.financial.topCities")}</p>
              <div className="space-y-1.5">
                {savingsData.topCities.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-sm bg-snow px-3 py-2">
                    <span className="text-sm text-slate">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-fog">{c.count} {t("analytics.financial.cmd")}</span>
                      <span className="font-mono text-sm font-bold text-midnight">
                        {formatCurrency(c.saved, locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
