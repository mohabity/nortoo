"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Crown } from "lucide-react";
import { PlanBadge } from "@/components/plan-badge";
import {
  PLAN_CONFIGS,
  PLAN_ORDER,
  type PlanId,
  type FeatureId,
  FEATURE_LABELS,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { BaseTabProps } from "../types";

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

const PLAN_CARD_COLORS: Record<PlanId, string> = {
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

export function BillingTab({ settings }: BaseTabProps) {
  const [data, setData] = useState<PlanApiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/plan")
      .then((r) => r.json())
      .then((json) => { if (json.data) setData(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
      </div>
    );
  }

  const currentPlan = data.plan;
  const payablePlans = PLAN_ORDER.filter((p) => p !== "trial") as PlanId[];

  return (
    <div className="space-y-8">
      {/* ── Current Plan ── */}
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
                Expire le {new Date(data.trial.expiresAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}
        </div>

        {/* Usage bars */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Orders */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-fog">Commandes ce mois</span>
              <span className="text-xs font-mono text-slate">
                {data.usage.orders.current}
                {data.usage.orders.limit > 0 ? ` / ${data.usage.orders.limit}` : " / ∞"}
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
                style={{ width: `${Math.min(data.usage.orders.percent, 100)}%` }}
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
      </div>

      {/* ── Plan Cards ── */}
      <div>
        <h2 className="font-display text-lg font-semibold text-midnight mb-4">
          Choisir un plan
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {payablePlans.map((planId) => {
            const config = PLAN_CONFIGS[planId];
            const isCurrent = planId === currentPlan;
            const isUpgrade =
              PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);

            return (
              <div
                key={planId}
                className={cn(
                  "relative rounded-sm border-2 bg-white p-5 transition-shadow",
                  isCurrent ? "ring-2 ring-mint shadow-md" : "",
                  PLAN_CARD_COLORS[planId]
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
                  <span className="font-display text-2xl font-bold text-midnight">
                    {config.price}
                  </span>
                  <span className="text-sm text-fog"> DH/mois</span>
                </div>

                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate">
                    <Check className="h-4 w-4 text-mint shrink-0 mt-0.5" />
                    {config.ordersPerMonth > 0
                      ? `${config.ordersPerMonth.toLocaleString("fr-FR")} commandes/mois`
                      : "Commandes illimitées"}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate">
                    <Check className="h-4 w-4 text-mint shrink-0 mt-0.5" />
                    {config.maxUsers} utilisateur{config.maxUsers > 1 ? "s" : ""}
                  </li>
                  {config.features
                    .filter(
                      (f) => !["scoring", "dashboard", "search"].includes(f)
                    )
                    .map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-slate"
                      >
                        <Check className="h-4 w-4 text-mint shrink-0 mt-0.5" />
                        {FEATURE_LABELS[feature as FeatureId]}
                      </li>
                    ))}
                </ul>

                <button
                  disabled={isCurrent}
                  className={cn(
                    "mt-5 w-full rounded-sm px-4 py-2.5 text-sm font-medium transition-colors",
                    isCurrent
                      ? "bg-snow text-mist cursor-not-allowed"
                      : isUpgrade
                        ? PLAN_CTA_COLORS[planId]
                        : "border border-silk text-fog hover:bg-snow"
                  )}
                  onClick={() => {
                    window.open(
                      `mailto:contact@nortoo.com?subject=Upgrade%20vers%20${config.name}&body=Je%20souhaite%20passer%20au%20plan%20${config.name}.`,
                      "_blank"
                    );
                  }}
                >
                  {isCurrent
                    ? "Plan actuel"
                    : isUpgrade
                      ? "Contactez-nous"
                      : "Downgrade"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-mist text-center">
          Pour changer de plan, contactez-nous par email. Le paiement se fait par virement bancaire ou carte.
        </p>
      </div>
    </div>
  );
}
