"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Check,
  Crown,
  ArrowRight,
  Sparkles,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PlanBadge } from "@/components/plan-badge";
import {
  PLAN_CONFIGS,
  PLAN_ORDER,
  type PlanId,
  type FeatureId,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency, formatNumber, formatDate } from "@/lib/i18n-utils";

// ── Types ──

interface PlanApiData {
  plan: PlanId;
  config: {
    name: string;
    price: number;
    label: string;
    ordersPerMonth: number;
    maxUsers: number;
    features: FeatureId[];
  };
  usage: {
    orders: { current: number; limit: number; percent: number };
    users: { current: number; limit: number };
  };
  trial: { daysRemaining: number; expiresAt: string } | null;
  currentMonthStart: string | null;
}

// ── Colors ──

const PLAN_CARD_BORDERS: Record<PlanId, string> = {
  trial: "border-silk",
  starter: "border-mint/40",
  pro: "border-ocean/40",
  scale: "border-violet/40",
};

const PLAN_CTA_COLORS: Record<PlanId, string> = {
  trial: "bg-slate text-white hover:bg-slate/90",
  starter: "bg-mint text-midnight hover:bg-mint-dark",
  pro: "bg-ocean text-white hover:bg-ocean/90",
  scale: "bg-violet text-white hover:bg-violet/90",
};

// ── Page ──

export default function BillingPage() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<PlanApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<PlanId | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/plan");
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleChangePlan = async (newPlan: PlanId) => {
    if (changing) return;
    setChanging(newPlan);

    try {
      const res = await fetch("/api/billing/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });

      const json = await res.json();

      if (res.ok) {
        setToast({
          type: "success",
          message: t("billing.toast.planChanged", { plan: t(`plans.${newPlan}.name`) }),
        });
        // Refresh data
        setLoading(true);
        await fetchData();
      } else {
        setToast({
          type: "error",
          message: json.error || t("billing.toast.planChangeError"),
        });
      }
    } catch {
      setToast({ type: "error", message: t("billing.toast.networkError") });
    } finally {
      setChanging(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
        <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
      </div>
    );
  }

  const currentPlan = data.plan;
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const nextPlanId = currentIdx < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIdx + 1] : null;

  // Features unlocked by next plan
  const nextPlanFeatures = nextPlanId
    ? PLAN_CONFIGS[nextPlanId].features.filter(
        (f) => !PLAN_CONFIGS[currentPlan].features.includes(f)
      )
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">{t("billing.title")}</h1>
        <p className="text-sm text-fog">
          {t("billing.subtitle")}
        </p>
      </div>

      {/* ═══ Section 1 — Plan actuel + usage ═══ */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-midnight">
              {t("billing.currentPlan")}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <PlanBadge plan={currentPlan} />
              <span className="text-sm text-fog">{t(`plans.${currentPlan}.label`)}</span>
            </div>
          </div>
          {data.trial && (
            <div className="text-right">
              <p className="text-sm font-medium text-sun-deep">
                {data.trial.daysRemaining > 0
                  ? data.trial.daysRemaining > 1
                    ? t("billing.trial.daysRemainingPlural", { count: data.trial.daysRemaining })
                    : t("billing.trial.daysRemaining", { count: data.trial.daysRemaining })
                  : t("billing.trial.expired")}
              </p>
              <p className="text-xs text-mist">
                {t("billing.trial.expiresAt", {
                  date: formatDate(data.trial.expiresAt, locale),
                })}
              </p>
            </div>
          )}
        </div>

        {/* Usage bars */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Orders */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-fog">
                {t("billing.usage.ordersThisMonth")}
              </span>
              <span className="text-xs font-mono text-slate">
                {data.usage.orders.current}
                {data.usage.orders.limit > 0
                  ? ` / ${formatNumber(data.usage.orders.limit, locale)}`
                  : " / ∞"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-snow">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  data.usage.orders.percent >= 100
                    ? "bg-rose"
                    : data.usage.orders.percent >= 80
                      ? "bg-sun"
                      : "bg-mint"
                )}
                style={{
                  width: `${Math.min(data.usage.orders.percent, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Users */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-fog">{t("billing.usage.users")}</span>
              <span className="text-xs font-mono text-slate">
                {data.usage.users.current} / {data.usage.users.limit}
              </span>
            </div>
            <div className="h-2 rounded-full bg-snow">
              <div
                className="h-2 rounded-full bg-ocean transition-all"
                style={{
                  width: `${Math.min(
                    (data.usage.users.current / data.usage.users.limit) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Inline alerts */}
        {data.trial && data.trial.daysRemaining <= 5 && data.trial.daysRemaining > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-sm bg-sun/5 border border-sun/20 px-4 py-3">
            <Clock className="h-4 w-4 text-sun-deep shrink-0" />
            <p className="text-sm text-sun-deep flex-1">
              {t("billing.alerts.trialEnding", { count: data.trial.daysRemaining })}
            </p>
          </div>
        )}

        {data.trial && data.trial.daysRemaining === 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-sm bg-rose/5 border border-rose/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose shrink-0" />
            <p className="text-sm text-rose flex-1">
              {t("billing.alerts.trialExpired")}
            </p>
          </div>
        )}

        {data.usage.orders.percent >= 100 && (
          <div className="mt-4 flex items-center gap-3 rounded-sm bg-ocean/5 border border-ocean/20 px-4 py-3">
            <Info className="h-4 w-4 text-ocean shrink-0" />
            <p className="text-sm text-ocean flex-1">
              {t("billing.alerts.limitReached")}
            </p>
          </div>
        )}

        {data.usage.orders.percent >= 80 && data.usage.orders.percent < 100 && (
          <div className="mt-4 flex items-center gap-3 rounded-sm bg-sun/5 border border-sun/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-sun-deep shrink-0" />
            <p className="text-sm text-sun-deep flex-1">
              {t("billing.alerts.limitApproaching", { percent: data.usage.orders.percent })}
            </p>
          </div>
        )}
      </div>

      {/* ═══ Section 2 — Plan Comparatif ═══ */}
      <div>
        <h2 className="font-display text-lg font-semibold text-midnight mb-4">
          {t("billing.comparison.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((planId) => {
            const config = PLAN_CONFIGS[planId];
            const isCurrent = planId === currentPlan;
            const isNext = planId === nextPlanId;
            const isUpgrade =
              PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);
            const isDowngrade =
              PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlan);
            const isChanging = changing === planId;

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

                <h3 className="font-display text-base font-bold text-midnight">
                  {t(`plans.${planId}.name`)}
                </h3>
                <div className="mt-1">
                  {config.price > 0 ? (
                    <>
                      <span className="font-display text-2xl font-bold text-midnight">
                        {formatCurrency(config.price, locale)}
                      </span>
                      <span className="text-sm text-fog">{t("currency.perMonth")}</span>
                    </>
                  ) : (
                    <span className="font-display text-lg font-bold text-fog">
                      {t("billing.free")}
                    </span>
                  )}
                </div>

                {/* Limits */}
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
                  {config.bulkBatchLimit > 0 && (
                    <p>{config.bulkBatchLimit} {t("billing.usage.perBatch")}</p>
                  )}
                  {config.bulkBatchLimit === 0 &&
                    config.features.includes("bulk_actions") && (
                      <p>{t("billing.usage.unlimitedBatch")}</p>
                    )}
                </div>

                {/* Features */}
                <ul className="mt-4 flex-1 space-y-1.5">
                  {config.features
                    .filter(
                      (f) => !["scoring", "dashboard", "search"].includes(f)
                    )
                    .map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-slate"
                      >
                        <Check className="h-3.5 w-3.5 text-mint shrink-0 mt-0.5" />
                        {t(`features.${feature}`)}
                      </li>
                    ))}
                  {config.features.filter(
                    (f) => !["scoring", "dashboard", "search"].includes(f)
                  ).length === 0 && (
                    <li className="text-xs text-mist italic">
                      {t("billing.usage.scoringDashboard")}
                    </li>
                  )}
                </ul>

                {/* CTA */}
                <button
                  disabled={isCurrent || isChanging || planId === "trial"}
                  className={cn(
                    "mt-5 w-full rounded-sm px-4 py-2.5 text-sm font-medium transition-all",
                    isCurrent
                      ? "border-2 border-mint bg-mint/5 text-mint cursor-not-allowed"
                      : planId === "trial"
                        ? "bg-snow text-mist cursor-not-allowed"
                        : isNext
                          ? cn(
                              "bg-gradient-to-r from-mint to-mint-deep text-midnight shadow-sm hover:shadow-lg hover:-translate-y-0.5",
                              isChanging && "opacity-70"
                            )
                          : isUpgrade
                            ? cn(
                                "border border-silk text-slate hover:border-mint/40 hover:text-mint",
                                isChanging && "opacity-70"
                              )
                            : isDowngrade
                              ? cn(
                                  "border border-silk text-fog hover:border-rose/40 hover:text-rose",
                                  isChanging && "opacity-70"
                                )
                              : "bg-snow text-mist cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (!isCurrent && planId !== "trial") {
                      handleChangePlan(planId);
                    }
                  }}
                >
                  {isChanging ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : isCurrent ? (
                    t("billing.comparison.currentPlan")
                  ) : planId === "trial" ? (
                    "—"
                  ) : isNext ? (
                    t("billing.comparison.upgradeTo", { plan: t(`plans.${planId}.name`) })
                  ) : isUpgrade ? (
                    t("billing.comparison.choose", { plan: t(`plans.${planId}.name`) })
                  ) : (
                    t("billing.comparison.downgrade")
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Section 3 — Ce que vous débloquez ═══ */}
      {nextPlanId && nextPlanFeatures.length > 0 && (
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
                <div
                  key={feature}
                  className="flex items-start gap-2.5 rounded-sm bg-snow px-4 py-3"
                >
                  <Check className="h-4 w-4 text-mint shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-midnight">
                      {t(`features.${feature}`)}
                    </p>
                  </div>
                </div>
              ))}

            {/* Limit increases */}
            {PLAN_CONFIGS[nextPlanId].ordersPerMonth !==
              PLAN_CONFIGS[currentPlan].ordersPerMonth && (
              <div className="flex items-start gap-2.5 rounded-sm bg-snow px-4 py-3">
                <ArrowRight className="h-4 w-4 text-ocean shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-midnight">
                  {PLAN_CONFIGS[nextPlanId].ordersPerMonth > 0
                    ? `${formatNumber(PLAN_CONFIGS[nextPlanId].ordersPerMonth, locale)} ${t("billing.usage.ordersPerMonth")}`
                    : t("billing.usage.unlimitedOrders")}{" "}
                  <span className="text-mist font-normal">
                    {t("billing.unlock.insteadOf")}{" "}
                    {formatNumber(PLAN_CONFIGS[currentPlan].ordersPerMonth, locale)}
                  </span>
                </p>
              </div>
            )}

            {PLAN_CONFIGS[nextPlanId].maxUsers !==
              PLAN_CONFIGS[currentPlan].maxUsers && (
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
              "bg-gradient-to-r from-mint to-mint-deep text-midnight shadow-sm hover:shadow-lg hover:-translate-y-0.5",
              changing === nextPlanId && "opacity-70"
            )}
            disabled={!!changing}
            onClick={() => handleChangePlan(nextPlanId)}
          >
            {changing === nextPlanId ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              <>
                {t("billing.comparison.upgradeTo", { plan: t(`plans.${nextPlanId}.name`) })}{" "}
                — {t(`plans.${nextPlanId}.label`)}
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ Section 4 — Historique placeholder ═══ */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <h2 className="font-display text-base font-semibold text-midnight mb-2">
          {t("billing.history.title")}
        </h2>
        <p className="text-sm text-fog">
          {t("billing.history.placeholder")}
        </p>
        <p className="mt-2 text-xs text-mist">
          {t("billing.history.contact")}{" "}
          <a
            href="mailto:support@nortoo.io"
            className="text-ocean hover:underline"
          >
            support@nortoo.io
          </a>
        </p>
      </div>

      {/* ═══ Toast ═══ */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 rounded-sm border bg-white px-4 py-3 shadow-lg animate-in slide-in-from-right-5",
            toast.type === "success"
              ? "border-l-4 border-l-mint"
              : "border-l-4 border-l-rose"
          )}
        >
          <p className="text-sm text-slate">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
