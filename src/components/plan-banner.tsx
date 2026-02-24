"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

interface PlanInfo {
  plan: string;
  billingStatus?: string;
  trial: { daysRemaining: number; expiresAt: string } | null;
  usage: {
    orders: { current: number; limit: number; percent: number };
  };
}

/**
 * Banner shown in the dashboard layout when:
 * - Trial <=3 days remaining
 * - Trial expired
 * - Orders >= 80% of limit
 * - Orders >= 100% of limit
 */
export function PlanBanner() {
  const { t } = useTranslation();
  const [data, setData] = useState<PlanInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/settings/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json) setData(json.data); })
      .catch(() => {});
  }, []);

  if (!data || dismissed) return null;

  // Determine which banner to show
  let variant: "warning" | "error" | "info" | null = null;
  let icon: React.ReactNode = null;
  let message: string = "";
  let cta: string | null = null;

  // Billing overdue (past_due)
  if (data.billingStatus === "past_due") {
    variant = "error";
    icon = <AlertTriangle className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.overdue");
    cta = t("components.planBanner.payNow");
  }
  // Trial expired
  else if (data.trial && data.trial.daysRemaining === 0) {
    variant = "error";
    icon = <AlertTriangle className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.trialExpired");
    cta = t("components.planBanner.seePlans");
  }
  // Trial <=3 days
  else if (data.trial && data.trial.daysRemaining <= 3 && data.trial.daysRemaining > 0) {
    variant = "warning";
    icon = <Clock className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.trialEnding", { count: data.trial.daysRemaining });
    cta = t("components.planBanner.seePlans");
  }
  // Orders >= 100% of limit
  else if (data.usage.orders.limit > 0 && data.usage.orders.percent >= 100) {
    variant = "info";
    icon = <TrendingUp className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.limitReached", { limit: data.usage.orders.limit });
    cta = t("components.planBanner.seePlans");
  }
  // Orders >= 80% of limit
  else if (data.usage.orders.limit > 0 && data.usage.orders.percent >= 80) {
    variant = "warning";
    icon = <TrendingUp className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.limitApproaching", {
      current: data.usage.orders.current,
      limit: data.usage.orders.limit,
      percent: data.usage.orders.percent,
    });
    cta = t("components.planBanner.seePlans");
  }

  if (!variant) return null;

  const colors = {
    warning: "bg-sun/10 border-sun/30 text-sun-deep",
    error: "bg-rose/10 border-rose/30 text-rose",
    info: "bg-ocean/10 border-ocean/30 text-ocean",
  };

  return (
    <div className={cn("flex items-center gap-3 border-b px-4 py-2 text-sm", colors[variant])}>
      {icon}
      <p className="flex-1">{message}</p>
      {cta && (
        <Link
          href="/dashboard/billing"
          className="shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
        >
          {cta}
        </Link>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
