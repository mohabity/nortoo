"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, TrendingUp, X, Ticket, CheckCircle2, Loader2 } from "lucide-react";
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
 * - Trial expired → NON-DISMISSIBLE + coupon input
 * - Past due → NON-DISMISSIBLE + coupon input
 * - Trial <=3 days remaining → dismissible
 * - Orders >= 80% of limit → dismissible
 * - Orders >= 100% of limit → dismissible
 */
export function PlanBanner() {
  const { t } = useTranslation();
  const [data, setData] = useState<PlanInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    fetch("/api/settings/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json) setData(json.data); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  // Determine which banner to show
  let variant: "warning" | "error" | "info" | null = null;
  let icon: React.ReactNode = null;
  let message: string = "";
  let cta: string | null = null;
  let canDismiss = true;
  let showCouponInput = false;

  // Billing overdue (past_due)
  if (data.billingStatus === "past_due") {
    variant = "error";
    icon = <AlertTriangle className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.overdue");
    cta = t("components.planBanner.payNow");
    canDismiss = false;
    showCouponInput = true;
  }
  // Trial expired
  else if (data.trial && data.trial.daysRemaining === 0) {
    variant = "error";
    icon = <AlertTriangle className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.trialExpired");
    cta = t("components.planBanner.seePlans");
    canDismiss = false;
    showCouponInput = true;
  }
  // Cancelled billing
  else if (data.billingStatus === "cancelled") {
    variant = "error";
    icon = <AlertTriangle className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.readOnly");
    cta = t("components.planBanner.seePlans");
    canDismiss = false;
    showCouponInput = true;
  }
  // Trial <=3 days
  else if (data.trial && data.trial.daysRemaining <= 3 && data.trial.daysRemaining > 0) {
    variant = "warning";
    icon = <Clock className="h-4 w-4 shrink-0" />;
    message = t("components.planBanner.trialEnding", { count: data.trial.daysRemaining });
    cta = t("components.planBanner.seePlans");
    showCouponInput = true;
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
  if (dismissed && canDismiss) return null;

  const colors = {
    warning: "bg-sun/10 border-sun/30 text-sun-deep",
    error: "bg-rose/10 border-rose/30 text-rose",
    info: "bg-ocean/10 border-ocean/30 text-ocean",
  };

  async function handleCouponApply() {
    const code = couponCode.trim();
    if (!code || couponLoading) return;

    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess(false);

    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        setCouponSuccess(true);
        setCouponCode("");
        // Reload data after a short delay to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const json = await res.json().catch(() => null);
        setCouponError(json?.error ?? t("components.planBanner.couponError"));
      }
    } catch {
      setCouponError(t("components.planBanner.couponError"));
    } finally {
      setCouponLoading(false);
    }
  }

  return (
    <div className={cn("border-b px-4 py-2.5 text-sm", colors[variant])}>
      {/* Main row */}
      <div className="flex items-center gap-3">
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
        {canDismiss && (
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Coupon input row (only for paywall states) */}
      {showCouponInput && (
        <div className="mt-2 flex items-center gap-2 pl-7">
          <Ticket className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="text-xs opacity-70">{t("components.planBanner.orUseCoupon")}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCouponApply()}
              placeholder={t("components.planBanner.couponPlaceholder")}
              className="h-7 w-36 rounded-md border border-current/20 bg-white/50 px-2 text-xs font-mono placeholder:text-current/40 focus:outline-none focus:ring-1 focus:ring-current/30"
              disabled={couponLoading || couponSuccess}
            />
            <button
              onClick={handleCouponApply}
              disabled={!couponCode.trim() || couponLoading || couponSuccess}
              className="h-7 rounded-md bg-current/10 px-2.5 text-xs font-medium hover:bg-current/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {couponLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("components.planBanner.couponApplying")}
                </>
              ) : couponSuccess ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  {t("components.planBanner.couponSuccess")}
                </>
              ) : (
                t("components.planBanner.couponApply")
              )}
            </button>
          </div>
          {couponError && (
            <span className="text-xs text-rose font-medium">{couponError}</span>
          )}
        </div>
      )}
    </div>
  );
}
