"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Check,
  Crown,
  ArrowRight,
  Sparkles,
  Clock,
  AlertTriangle,
  Info,
  Download,
  Copy,
  Save,
  FileText,
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
import { BANK_INFO } from "@/lib/billing-config";

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

interface BillingInfo {
  billingName: string | null;
  billingAddress: string | null;
  billingICE: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  period: string;
  planAtInvoice: string;
  amountHT: number;
  tvaRate: number;
  amountTVA: number;
  amountTTC: number;
  status: string;
  paidAt: string | null;
  paidNote: string | null;
  dueDate: string;
  createdAt: string;
}

// ── Colors ──

const PLAN_CARD_BORDERS: Record<PlanId, string> = {
  trial: "border-silk",
  starter: "border-mint/40",
  pro: "border-ocean/40",
  scale: "border-violet/40",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-sun/10 text-sun-deep border-sun/30",
  paid: "bg-mint/10 text-mint-deep border-mint/30",
  overdue: "bg-rose/10 text-rose border-rose/30",
  cancelled: "bg-fog/10 text-fog border-fog/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

function formatAmountDH(centimes: number): string {
  const dh = centimes / 100;
  return dh.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
}

// ── Page ──

export default function BillingPage() {
  const { t, locale } = useTranslation();
  const [planData, setPlanData] = useState<PlanApiData | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    billingName: "",
    billingAddress: "",
    billingICE: "",
  });
  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState<PlanId | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [planRes, infoRes, invRes] = await Promise.all([
        fetch("/api/settings/plan"),
        fetch("/api/billing/info"),
        fetch("/api/billing/invoices"),
      ]);
      const planJson = await planRes.json();
      const infoJson = await infoRes.json();
      const invJson = await invRes.json();

      if (planJson.data) setPlanData(planJson.data);
      if (infoJson.data) setBillingInfo({
        billingName: infoJson.data.billingName || "",
        billingAddress: infoJson.data.billingAddress || "",
        billingICE: infoJson.data.billingICE || "",
      });
      if (invJson.data) setInvoicesList(invJson.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSaveBilling = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/billing/info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billingInfo),
      });
      if (res.ok) {
        setToast({ type: "success", message: t("billing.billingInfo.saved") });
      } else {
        setToast({ type: "error", message: t("billing.billingInfo.error") });
      }
    } catch {
      setToast({ type: "error", message: t("billing.toast.networkError") });
    } finally {
      setSaving(false);
    }
  };

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
        setToast({ type: "success", message: t("billing.toast.planChanged", { plan: t(`plans.${newPlan}.name`) }) });
        setLoading(true);
        await fetchAll();
      } else {
        setToast({ type: "error", message: json.error || t("billing.toast.planChangeError") });
      }
    } catch {
      setToast({ type: "error", message: t("billing.toast.networkError") });
    } finally {
      setChanging(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading || !planData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
        <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
      </div>
    );
  }

  const currentPlan = planData.plan;
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const nextPlanId = currentIdx < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIdx + 1] : null;
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
        <p className="text-sm text-fog">{t("billing.subtitle")}</p>
      </div>

      {/* Section 1 — Plan actuel + usage */}
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

      {/* Section 2 — Informations de facturation */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <h2 className="font-display text-base font-semibold text-midnight mb-4">
          {t("billing.billingInfo.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-fog mb-1 block">{t("billing.billingInfo.companyName")}</label>
            <input
              type="text"
              value={billingInfo.billingName || ""}
              onChange={(e) => setBillingInfo({ ...billingInfo, billingName: e.target.value })}
              placeholder={t("billing.billingInfo.companyNamePlaceholder")}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-fog mb-1 block">{t("billing.billingInfo.ice")}</label>
            <input
              type="text"
              value={billingInfo.billingICE || ""}
              onChange={(e) => setBillingInfo({ ...billingInfo, billingICE: e.target.value })}
              placeholder="00000000000000"
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-fog mb-1 block">{t("billing.billingInfo.address")}</label>
            <input
              type="text"
              value={billingInfo.billingAddress || ""}
              onChange={(e) => setBillingInfo({ ...billingInfo, billingAddress: e.target.value })}
              placeholder={t("billing.billingInfo.addressPlaceholder")}
              className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={handleSaveBilling}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-sm bg-mint px-4 py-2 text-sm font-medium text-midnight hover:bg-mint-dark transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("billing.billingInfo.save")}
        </button>
      </div>

      {/* Section 3 — Coordonnées bancaires */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <h2 className="font-display text-base font-semibold text-midnight mb-4">{t("billing.bankInfo.title")}</h2>
        <p className="text-sm text-fog mb-4">{t("billing.bankInfo.description")}</p>
        <div className="space-y-3 rounded-sm bg-snow p-4">
          {[
            { label: "Banque", value: BANK_INFO.bankName, key: "bank" },
            { label: "Titulaire", value: BANK_INFO.accountHolder, key: "holder" },
            { label: "RIB", value: BANK_INFO.rib, key: "rib" },
            { label: "IBAN", value: BANK_INFO.iban, key: "iban" },
            { label: "SWIFT", value: BANK_INFO.swift, key: "swift" },
          ].map(({ label, value, key }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <span className="text-xs text-fog">{label}</span>
                <p className="text-sm font-mono text-midnight">{value}</p>
              </div>
              <button
                onClick={() => copyToClipboard(value, key)}
                className="shrink-0 rounded-sm p-1.5 text-fog hover:text-midnight hover:bg-silk/50 transition-colors"
                title="Copier"
              >
                {copied === key ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 — Historique des factures */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-fog" />
          <h2 className="font-display text-base font-semibold text-midnight">{t("billing.invoices.title")}</h2>
        </div>
        {invoicesList.length === 0 ? (
          <p className="text-sm text-mist py-8 text-center">{t("billing.invoices.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silk">
                  <th className="pb-2 text-left text-xs font-medium text-fog">N°</th>
                  <th className="pb-2 text-left text-xs font-medium text-fog">{t("billing.invoices.period")}</th>
                  <th className="pb-2 text-right text-xs font-medium text-fog">{t("billing.invoices.amountTTC")}</th>
                  <th className="pb-2 text-center text-xs font-medium text-fog">{t("billing.invoices.status")}</th>
                  <th className="pb-2 text-right text-xs font-medium text-fog"></th>
                </tr>
              </thead>
              <tbody>
                {invoicesList.map((inv) => (
                  <tr key={inv.id} className="border-b border-snow last:border-0">
                    <td className="py-3 font-mono text-xs text-midnight">{inv.invoiceNumber}</td>
                    <td className="py-3 text-slate">{inv.period}</td>
                    <td className="py-3 text-right font-medium text-midnight">{formatAmountDH(inv.amountTTC)}</td>
                    <td className="py-3 text-center">
                      <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLES[inv.status] || STATUS_STYLES.pending)}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={`/api/billing/invoices/${inv.id}/pdf`}
                        className="inline-flex items-center gap-1 text-xs text-ocean hover:text-ocean/80"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 5 — Plan Comparatif */}
      <div>
        <h2 className="font-display text-lg font-semibold text-midnight mb-4">{t("billing.comparison.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((planId) => {
            const config = PLAN_CONFIGS[planId];
            const isCurrent = planId === currentPlan;
            const isNext = planId === nextPlanId;
            const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);
            const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlan);
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
                <h3 className="font-display text-base font-bold text-midnight">{t(`plans.${planId}.name`)}</h3>
                <div className="mt-1">
                  {config.price > 0 ? (
                    <>
                      <span className="font-display text-2xl font-bold text-midnight">{formatCurrency(config.price, locale)}</span>
                      <span className="text-sm text-fog">{t("currency.perMonth")}</span>
                      <p className="text-xs text-mist mt-0.5">HT · {formatCurrency(Math.round(config.price * 1.2), locale)} TTC</p>
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
                  disabled={isCurrent || isChanging || planId === "trial"}
                  className={cn(
                    "mt-5 w-full rounded-sm px-4 py-2.5 text-sm font-medium transition-all",
                    isCurrent ? "border-2 border-mint bg-mint/5 text-mint cursor-not-allowed"
                      : planId === "trial" ? "bg-snow text-mist cursor-not-allowed"
                      : isNext ? cn("bg-gradient-to-r from-mint to-mint-deep text-midnight shadow-sm hover:shadow-lg hover:-translate-y-0.5", isChanging && "opacity-70")
                      : isUpgrade ? cn("border border-silk text-slate hover:border-mint/40 hover:text-mint", isChanging && "opacity-70")
                      : isDowngrade ? cn("border border-silk text-fog hover:border-rose/40 hover:text-rose", isChanging && "opacity-70")
                      : "bg-snow text-mist cursor-not-allowed"
                  )}
                  onClick={() => { if (!isCurrent && planId !== "trial") handleChangePlan(planId); }}
                >
                  {isChanging ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    : isCurrent ? t("billing.comparison.currentPlan")
                    : planId === "trial" ? "—"
                    : isNext ? t("billing.comparison.upgradeTo", { plan: t(`plans.${planId}.name`) })
                    : isUpgrade ? t("billing.comparison.choose", { plan: t(`plans.${planId}.name`) })
                    : t("billing.comparison.downgrade")}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 6 — Ce que vous débloquez */}
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

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 rounded-sm border bg-white px-4 py-3 shadow-lg animate-in slide-in-from-right-5",
            toast.type === "success" ? "border-l-4 border-l-mint" : "border-l-4 border-l-rose"
          )}
        >
          <p className="text-sm text-slate">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
