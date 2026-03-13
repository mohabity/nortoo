"use client";

import { Check, Crown, Loader2 } from "lucide-react";
import { PLAN_CONFIGS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency, formatNumber } from "@/lib/i18n-utils";
import type { PlanApiData, PendingUpgrade } from "./billing-types";
import { PLAN_CARD_BORDERS } from "./billing-types";

interface PlanComparisonProps {
  planData: PlanApiData;
  pendingUpgrade: PendingUpgrade | null;
  changing: PlanId | null;
  onChangePlan: (plan: PlanId) => void;
}

export function PlanComparison({ planData, pendingUpgrade, changing, onChangePlan }: PlanComparisonProps) {
  const { t, locale } = useTranslation();
  const currentPlan = planData.plan;

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-midnight mb-4">{t("billing.comparison.title")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const config = PLAN_CONFIGS[planId];
          const isCurrent = planId === currentPlan;
          const isNext = planId === (PLAN_ORDER.indexOf(currentPlan) < PLAN_ORDER.length - 1 ? PLAN_ORDER[PLAN_ORDER.indexOf(currentPlan) + 1] : null);
          const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);
          const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlan);
          const isChanging = changing === planId;
          const isDowngradeTarget = planData.pendingPlanDowngrade === planId;

          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-sm border-2 bg-white p-5 transition-shadow",
                isCurrent ? "ring-2 ring-mint shadow-md" : "",
                PLAN_CARD_BORDERS[planId]
              )}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-mint px-2.5 py-0.5 text-[10px] font-semibold text-midnight">
                  <Crown className="h-3 w-3" />
                  {t("billing.comparison.current")}
                </div>
              )}
              <h3 className="font-display text-base font-bold text-midnight">{t(`plans.${planId}.name`)}</h3>
              <div className="mt-1">
                {config.price > 0 ? (
                  <>
                    <span className="font-display text-2xl font-bold text-midnight">{formatCurrency(config.price, locale)}</span>
                    <span className="text-sm text-fog"> TTC{t("currency.perMonth")}</span>
                    <p className="text-xs text-mist mt-0.5">HT : {formatCurrency(Math.round(config.price / 1.2), locale)} · TVA : {formatCurrency(config.price - Math.round(config.price / 1.2), locale)}</p>
                  </>
                ) : (
                  <span className="font-display text-lg font-bold text-fog">{t("billing.free")}</span>
                )}
              </div>
              <div className="mt-3 space-y-1 text-xs text-fog">
                <p>
                  {config.ordersPerMonth > 0
                    ? `${formatNumber(config.ordersPerMonth, locale)} ${t("billing.usage.ordersPerMonth")}`
                    : t("billing.usage.unlimitedOrders")}
                </p>
                <p>
                  {config.maxUsers > 1
                    ? t("billing.usage.usersCountPlural", { count: config.maxUsers })
                    : t("billing.usage.usersCount", { count: config.maxUsers })}
                </p>
              </div>
              <ul className="mt-4 flex-1 space-y-1.5">
                {config.features
                  .filter((f) => !["scoring", "dashboard", "search"].includes(f))
                  .map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-slate">
                      <Check className="h-3.5 w-3.5 text-mint shrink-0 mt-0.5" />
                      {t(`features.${feature}`)}
                    </li>
                  ))}
                {config.features.filter((f) => !["scoring", "dashboard", "search"].includes(f)).length === 0 && (
                  <li className="text-xs text-mist italic">{t("billing.usage.scoringDashboard")}</li>
                )}
              </ul>
              <button
                disabled={isCurrent || isChanging || planId === "trial" || (pendingUpgrade?.pending && isUpgrade) || isDowngradeTarget}
                className={cn(
                  "mt-5 w-full rounded-sm px-4 py-2.5 text-sm font-medium transition-all",
                  isCurrent ? "border-2 border-mint bg-mint/5 text-mint cursor-not-allowed"
                    : isDowngradeTarget ? "border-2 border-sun/40 bg-sun/5 text-sun-deep cursor-not-allowed"
                    : planId === "trial" ? "bg-snow text-mist cursor-not-allowed"
                    : (pendingUpgrade?.pending && isUpgrade) ? "bg-snow text-mist cursor-not-allowed"
                    : isNext ? cn("bg-gradient-to-r from-mint to-mint-deep text-midnight shadow-sm hover:shadow-lg hover:-translate-y-0.5", isChanging && "opacity-70")
                    : isUpgrade ? cn("border border-silk text-slate hover:border-mint/40 hover:text-mint", isChanging && "opacity-70")
                    : isDowngrade ? cn("border border-silk text-fog hover:border-rose/40 hover:text-rose", isChanging && "opacity-70")
                    : "bg-snow text-mist cursor-not-allowed"
                )}
                onClick={() => { if (!isCurrent && planId !== "trial" && !isDowngradeTarget) onChangePlan(planId); }}
              >
                {isChanging ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  : isCurrent ? t("billing.comparison.currentPlan")
                  : isDowngradeTarget ? "Rétrogradation planifiée"
                  : planId === "trial" ? "—"
                  : (pendingUpgrade?.pending && isUpgrade) ? "Upgrade en cours..."
                  : isNext ? t("billing.comparison.upgradeTo", { plan: t(`plans.${planId}.name`) })
                  : isUpgrade ? t("billing.comparison.choose", { plan: t(`plans.${planId}.name`) })
                  : t("billing.comparison.downgrade")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
