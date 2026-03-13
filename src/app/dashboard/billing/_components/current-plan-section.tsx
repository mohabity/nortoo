"use client";

import { Clock, AlertTriangle, Info } from "lucide-react";
import { PlanBadge } from "@/components/plan-badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatNumber, formatDate } from "@/lib/i18n-utils";
import type { PlanApiData } from "./billing-types";

interface CurrentPlanSectionProps {
  planData: PlanApiData;
}

export function CurrentPlanSection({ planData }: CurrentPlanSectionProps) {
  const { t, locale } = useTranslation();
  const currentPlan = planData.plan;

  return (
    <div className="rounded-sm border border-silk bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-midnight">{t("billing.currentPlan")}</h2>
          <div className="mt-1 flex items-center gap-2">
            <PlanBadge plan={currentPlan} />
            <span className="text-sm text-fog">{t(`plans.${currentPlan}.label`)}</span>
          </div>
        </div>
        {planData.trial && (
          <div className="text-right">
            <p className="text-sm font-medium text-sun-deep">
              {planData.trial.daysRemaining > 0
                ? planData.trial.daysRemaining > 1
                  ? t("billing.trial.daysRemainingPlural", { count: planData.trial.daysRemaining })
                  : t("billing.trial.daysRemaining", { count: planData.trial.daysRemaining })
                : t("billing.trial.expired")}
            </p>
            <p className="text-xs text-mist">
              {t("billing.trial.expiresAt", { date: formatDate(planData.trial.expiresAt, locale) })}
            </p>
          </div>
        )}
      </div>

      {/* Usage bars */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-fog">{t("billing.usage.ordersThisMonth")}</span>
            <span className="text-xs font-mono text-slate">
              {planData.usage.orders.current}
              {planData.usage.orders.limit > 0
                ? ` / ${formatNumber(planData.usage.orders.limit, locale)}`
                : " / ∞"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-snow">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                planData.usage.orders.percent >= 100 ? "bg-rose"
                  : planData.usage.orders.percent >= 80 ? "bg-sun" : "bg-mint"
              )}
              style={{ width: `${Math.min(planData.usage.orders.percent, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-fog">{t("billing.usage.users")}</span>
            <span className="text-xs font-mono text-slate">
              {planData.usage.users.current} / {planData.usage.users.limit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-snow">
            <div
              className="h-2 rounded-full bg-ocean transition-all"
              style={{ width: `${Math.min((planData.usage.users.current / planData.usage.users.limit) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Inline alerts */}
      {planData.trial && planData.trial.daysRemaining <= 5 && planData.trial.daysRemaining > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-sm bg-sun/5 border border-sun/20 px-4 py-3">
          <Clock className="h-4 w-4 text-sun-deep shrink-0" />
          <p className="text-sm text-sun-deep flex-1">{t("billing.alerts.trialEnding", { count: planData.trial.daysRemaining })}</p>
        </div>
      )}
      {planData.trial && planData.trial.daysRemaining === 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-sm bg-rose/5 border border-rose/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-rose shrink-0" />
          <p className="text-sm text-rose flex-1">{t("billing.alerts.trialExpired")}</p>
        </div>
      )}
      {planData.usage.orders.percent >= 100 && (
        <div className="mt-4 flex items-center gap-3 rounded-sm bg-ocean/5 border border-ocean/20 px-4 py-3">
          <Info className="h-4 w-4 text-ocean shrink-0" />
          <p className="text-sm text-ocean flex-1">{t("billing.alerts.limitReached")}</p>
        </div>
      )}
      {planData.usage.orders.percent >= 80 && planData.usage.orders.percent < 100 && (
        <div className="mt-4 flex items-center gap-3 rounded-sm bg-sun/5 border border-sun/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-sun-deep shrink-0" />
          <p className="text-sm text-sun-deep flex-1">{t("billing.alerts.limitApproaching", { percent: planData.usage.orders.percent })}</p>
        </div>
      )}
    </div>
  );
}
