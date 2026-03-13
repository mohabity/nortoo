"use client";

import { Check, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { PLAN_CONFIGS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatNumber } from "@/lib/i18n-utils";
import type { PendingUpgrade } from "./billing-types";

interface UnlockFeaturesProps {
  currentPlan: PlanId;
  pendingUpgrade: PendingUpgrade | null;
  changing: PlanId | null;
  onChangePlan: (plan: PlanId) => void;
}

export function UnlockFeatures({ currentPlan, pendingUpgrade, changing, onChangePlan }: UnlockFeaturesProps) {
  const { t, locale } = useTranslation();

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const nextPlanId = currentIdx < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIdx + 1] : null;
  if (!nextPlanId) return null;

  const nextPlanFeatures = PLAN_CONFIGS[nextPlanId].features.filter(
    (f) => !PLAN_CONFIGS[currentPlan].features.includes(f)
  );
  if (nextPlanFeatures.length === 0) return null;

  return (
    <div className="rounded-sm border border-silk bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-sun" />
        <h2 className="font-display text-base font-semibold text-midnight">
          {t("billing.unlock.title", { plan: t(`plans.${nextPlanId}.name`) })}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {nextPlanFeatures
          .filter((f) => !["scoring", "dashboard", "search"].includes(f))
          .map((feature) => (
            <div key={feature} className="flex items-start gap-2.5 rounded-sm bg-snow px-4 py-3">
              <Check className="h-4 w-4 text-mint shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-midnight">{t(`features.${feature}`)}</p>
            </div>
          ))}
        {PLAN_CONFIGS[nextPlanId].ordersPerMonth !== PLAN_CONFIGS[currentPlan].ordersPerMonth && (
          <div className="flex items-start gap-2.5 rounded-sm bg-snow px-4 py-3">
            <ArrowRight className="h-4 w-4 text-ocean shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-midnight">
              {PLAN_CONFIGS[nextPlanId].ordersPerMonth > 0
                ? `${formatNumber(PLAN_CONFIGS[nextPlanId].ordersPerMonth, locale)} ${t("billing.usage.ordersPerMonth")}`
                : t("billing.usage.unlimitedOrders")}{" "}
              <span className="text-mist font-normal">
                {t("billing.unlock.insteadOf")} {formatNumber(PLAN_CONFIGS[currentPlan].ordersPerMonth, locale)}
              </span>
            </p>
          </div>
        )}
        {PLAN_CONFIGS[nextPlanId].maxUsers !== PLAN_CONFIGS[currentPlan].maxUsers && (
          <div className="flex items-start gap-2.5 rounded-sm bg-snow px-4 py-3">
            <ArrowRight className="h-4 w-4 text-ocean shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-midnight">
              {PLAN_CONFIGS[nextPlanId].maxUsers} {t("billing.unlock.users")}{" "}
              <span className="text-mist font-normal">
                {t("billing.unlock.insteadOf")} {PLAN_CONFIGS[currentPlan].maxUsers}
              </span>
            </p>
          </div>
        )}
      </div>
      <button
        className={cn(
          "mt-6 w-full rounded-sm px-4 py-3 text-sm font-medium transition-all",
          pendingUpgrade?.pending
            ? "bg-snow text-mist cursor-not-allowed"
            : "bg-gradient-to-r from-mint to-mint-deep text-midnight shadow-sm hover:shadow-lg hover:-translate-y-0.5",
          changing === nextPlanId && "opacity-70"
        )}
        disabled={!!changing || !!pendingUpgrade?.pending}
        onClick={() => onChangePlan(nextPlanId)}
      >
        {changing === nextPlanId ? (
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        ) : pendingUpgrade?.pending ? (
          "Upgrade en cours..."
        ) : (
          <>
            {t("billing.comparison.upgradeTo", { plan: t(`plans.${nextPlanId}.name`) })}{" "}
            — {t(`plans.${nextPlanId}.label`)}
          </>
        )}
      </button>
    </div>
  );
}
