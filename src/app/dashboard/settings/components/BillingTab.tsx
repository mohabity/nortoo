"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { PlanBadge } from "@/components/plan-badge";
import { type PlanId, type FeatureId } from "@/lib/plans";
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

  return (
    <div className="space-y-6">
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
                {data.usage.orders.limit > 0 ? ` / ${data.usage.orders.limit.toLocaleString("fr-FR")}` : " / ∞"}
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

      {/* ── Link to full billing page ── */}
      <Link
        href="/dashboard/billing"
        className="flex items-center justify-center gap-2 rounded-sm border border-silk bg-snow px-6 py-4 text-sm font-medium text-slate hover:bg-mint-bg/30 hover:border-mint/30 transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        Voir tous les plans et gérer votre abonnement →
      </Link>
    </div>
  );
}
