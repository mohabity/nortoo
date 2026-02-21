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
  FEATURE_LABELS,
  type PlanId,
  type FeatureId,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

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
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
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
          message: `Plan changé vers ${PLAN_CONFIGS[newPlan].name} avec succès.`,
        });
        // Refresh data
        setLoading(true);
        await fetchData();
      } else {
        setToast({
          type: "error",
          message: json.error || "Erreur lors du changement de plan.",
        });
      }
    } catch {
      setToast({ type: "error", message: "Erreur réseau. Réessayez." });
    } finally {
      setChanging(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
        <span className="ml-2 text-sm text-fog">Chargement...</span>
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
        <h1 className="font-display text-2xl font-bold text-midnight">Facturation</h1>
        <p className="text-sm text-fog">
          Gérez votre abonnement et suivez votre utilisation
        </p>
      </div>

      {/* ═══ Section 1 — Plan actuel + usage ═══ */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-midnight">
              Plan actuel
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <PlanBadge plan={currentPlan} />
              <span className="text-sm text-fog">{data.config.label}</span>
            </div>
          </div>
          {data.trial && (
            <div className="text-right">
              <p className="text-sm font-medium text-sun-deep">
                {data.trial.daysRemaining > 0
                  ? `${data.trial.daysRemaining} jour${data.trial.daysRemaining > 1 ? "s" : ""} restant${data.trial.daysRemaining > 1 ? "s" : ""}`
                  : "Essai terminé"}
              </p>
              <p className="text-xs text-mist">
                Expire le{" "}
                {new Date(data.trial.expiresAt).toLocaleDateString("fr-FR")}
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
                Commandes ce mois
              </span>
              <span className="text-xs font-mono text-slate">
                {data.usage.orders.current}
                {data.usage.orders.limit > 0
                  ? ` / ${data.usage.orders.limit.toLocaleString("fr-FR")}`
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
              <span className="text-xs font-medium text-fog">Utilisateurs</span>
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
              Votre essai se termine dans {data.trial.daysRemaining} jour
              {data.trial.daysRemaining > 1 ? "s" : ""}. Passez à un plan payant
              pour continuer.
            </p>
          </div>
        )}

        {data.trial && data.trial.daysRemaining === 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-sm bg-rose/5 border border-rose/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-rose shrink-0" />
            <p className="text-sm text-rose flex-1">
              Votre période d&apos;essai est terminée. Choisissez un plan pour
              continuer à scorer vos commandes.
            </p>
          </div>
        )}

        {data.usage.orders.percent >= 100 && (
          <div className="mt-4 flex items-center gap-3 rounded-sm bg-ocean/5 border border-ocean/20 px-4 py-3">
            <Info className="h-4 w-4 text-ocean shrink-0" />
            <p className="text-sm text-ocean flex-1">
              Limite atteinte. Le scoring continue mais passez au plan supérieur
              pour un accès complet.
            </p>
          </div>
        )}

        {data.usage.orders.percent >= 80 && data.usage.orders.percent < 100 && (
          <div className="mt-4 flex items-center gap-3 rounded-sm bg-sun/5 border border-sun/20 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-sun-deep shrink-0" />
            <p className="text-sm text-sun-deep flex-1">
              Vous approchez de votre limite ({data.usage.orders.percent}%).
              Passez au plan supérieur pour augmenter votre quota.
            </p>
          </div>
        )}
      </div>

      {/* ═══ Section 2 — Plan Comparatif ═══ */}
      <div>
        <h2 className="font-display text-lg font-semibold text-midnight mb-4">
          Choisir un plan
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
                    Actuel
                  </div>
                )}

                <h3 className="font-display text-base font-bold text-midnight">
                  {config.name}
                </h3>
                <div className="mt-1">
                  {config.price > 0 ? (
                    <>
                      <span className="font-display text-2xl font-bold text-midnight">
                        {config.price.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-sm text-fog"> DH/mois</span>
                    </>
                  ) : (
                    <span className="font-display text-lg font-bold text-fog">
                      Gratuit
                    </span>
                  )}
                </div>

                {/* Limits */}
                <div className="mt-3 space-y-1 text-xs text-fog">
                  <p>
                    {config.ordersPerMonth > 0
                      ? `${config.ordersPerMonth.toLocaleString("fr-FR")} commandes/mois`
                      : "Commandes illimitées"}
                  </p>
                  <p>
                    {config.maxUsers} utilisateur{config.maxUsers > 1 ? "s" : ""}
                  </p>
                  {config.bulkBatchLimit > 0 && (
                    <p>{config.bulkBatchLimit} par lot</p>
                  )}
                  {config.bulkBatchLimit === 0 &&
                    config.features.includes("bulk_actions") && (
                      <p>Lots illimités</p>
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
                        {FEATURE_LABELS[feature as FeatureId]}
                      </li>
                    ))}
                  {config.features.filter(
                    (f) => !["scoring", "dashboard", "search"].includes(f)
                  ).length === 0 && (
                    <li className="text-xs text-mist italic">
                      Scoring + Dashboard
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
                    "Plan actuel ✓"
                  ) : planId === "trial" ? (
                    "—"
                  ) : isNext ? (
                    <>Passer au {config.name} →</>
                  ) : isUpgrade ? (
                    `Choisir ${config.name}`
                  ) : (
                    "Rétrograder"
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
              En passant au {PLAN_CONFIGS[nextPlanId].name}, vous débloquez
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
                      {FEATURE_LABELS[feature as FeatureId]}
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
                    ? `${PLAN_CONFIGS[nextPlanId].ordersPerMonth.toLocaleString("fr-FR")} commandes/mois`
                    : "Commandes illimitées"}{" "}
                  <span className="text-mist font-normal">
                    au lieu de{" "}
                    {PLAN_CONFIGS[currentPlan].ordersPerMonth.toLocaleString(
                      "fr-FR"
                    )}
                  </span>
                </p>
              </div>
            )}

            {PLAN_CONFIGS[nextPlanId].maxUsers !==
              PLAN_CONFIGS[currentPlan].maxUsers && (
              <div className="flex items-start gap-2.5 rounded-sm bg-snow px-4 py-3">
                <ArrowRight className="h-4 w-4 text-ocean shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-midnight">
                  {PLAN_CONFIGS[nextPlanId].maxUsers} utilisateurs{" "}
                  <span className="text-mist font-normal">
                    au lieu de {PLAN_CONFIGS[currentPlan].maxUsers}
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
                Passer au {PLAN_CONFIGS[nextPlanId].name} —{" "}
                {PLAN_CONFIGS[nextPlanId].label} →
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ Section 4 — Historique placeholder ═══ */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <h2 className="font-display text-base font-semibold text-midnight mb-2">
          Historique de facturation
        </h2>
        <p className="text-sm text-fog">
          L&apos;historique de facturation sera disponible prochainement.
        </p>
        <p className="mt-2 text-xs text-mist">
          Pour toute question :{" "}
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
