"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { PlanId } from "@/lib/plans";
import type {
  PlanApiData,
  BillingInfo,
  Invoice,
  PendingUpgrade,
  UpgradeConfirmation,
} from "./_components/billing-types";

import { CurrentPlanSection } from "./_components/current-plan-section";
import { PendingUpgradeBanner, PendingDowngradeBanner } from "./_components/pending-banners";
import { BillingInfoForm } from "./_components/billing-info-form";
import { InvoicesTable } from "./_components/invoices-table";
import { PlanComparison } from "./_components/plan-comparison";
import { UnlockFeatures } from "./_components/unlock-features";
import { UpgradeModal } from "./_components/upgrade-modal";

export default function BillingPage() {
  const { t } = useTranslation();
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
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingUpgrade, setPendingUpgrade] = useState<PendingUpgrade | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<UpgradeConfirmation | null>(null);
  const [cancellingDowngrade, setCancellingDowngrade] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [planRes, infoRes, invRes, upgradeRes] = await Promise.all([
        fetch("/api/settings/plan"),
        fetch("/api/billing/info"),
        fetch("/api/billing/invoices"),
        fetch("/api/billing/upgrade-status"),
      ]);
      const planJson = await planRes.json();
      const infoJson = await infoRes.json();
      const invJson = await invRes.json();
      const upgradeJson = await upgradeRes.json();

      if (planJson.data) setPlanData(planJson.data);
      if (infoJson.data) setBillingInfo({
        billingName: infoJson.data.billingName || "",
        billingAddress: infoJson.data.billingAddress || "",
        billingICE: infoJson.data.billingICE || "",
      });
      if (invJson.data) setInvoicesList(invJson.data);
      if (upgradeJson.data) setPendingUpgrade(upgradeJson.data);
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
      setToast(res.ok
        ? { type: "success", message: t("billing.billingInfo.saved") }
        : { type: "error", message: t("billing.billingInfo.error") }
      );
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
      if (res.ok && json.data) {
        if (json.data.type === "downgrade_scheduled") {
          setToast({ type: "success", message: json.data.message });
        } else {
          setUpgradeModal({
            invoiceNumber: json.data.invoiceNumber,
            plan: json.data.plan,
            planName: json.data.planName,
            amountHT: json.data.amountHT,
            amountTVA: json.data.amountTVA,
            amountTTC: json.data.amountTTC,
            dueDate: json.data.dueDate,
          });
        }
        fetchAll();
      } else {
        setToast({ type: "error", message: json.error || t("billing.toast.planChangeError") });
      }
    } catch {
      setToast({ type: "error", message: t("billing.toast.networkError") });
    } finally {
      setChanging(null);
    }
  };

  const handleCancelDowngrade = async () => {
    if (cancellingDowngrade) return;
    setCancellingDowngrade(true);
    try {
      const res = await fetch("/api/billing/cancel-downgrade", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.data) {
        setToast({ type: "success", message: json.data.message });
        fetchAll();
      } else {
        setToast({ type: "error", message: json.error || "Erreur" });
      }
    } catch {
      setToast({ type: "error", message: t("billing.toast.networkError") });
    } finally {
      setCancellingDowngrade(false);
    }
  };

  if (loading || !planData) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
        <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">{t("billing.title")}</h1>
        <p className="text-sm text-fog">{t("billing.subtitle")}</p>
      </div>

      <CurrentPlanSection planData={planData} />

      {pendingUpgrade && <PendingUpgradeBanner pendingUpgrade={pendingUpgrade} />}

      <PendingDowngradeBanner
        planData={planData}
        onCancelDowngrade={handleCancelDowngrade}
        cancelling={cancellingDowngrade}
      />

      <BillingInfoForm
        billingInfo={billingInfo}
        onChange={setBillingInfo}
        onSave={handleSaveBilling}
        saving={saving}
      />

      {/* Bank info notice */}
      <div className="rounded-sm border border-silk bg-white p-6">
        <h2 className="font-display text-base font-semibold text-midnight mb-2">{t("billing.bankInfo.title")}</h2>
        <p className="text-sm text-fog">{t("billing.bankInfo.emailNotice")}</p>
      </div>

      <InvoicesTable invoices={invoicesList} />

      <PlanComparison
        planData={planData}
        pendingUpgrade={pendingUpgrade}
        changing={changing}
        onChangePlan={handleChangePlan}
      />

      <UnlockFeatures
        currentPlan={planData.plan}
        pendingUpgrade={pendingUpgrade}
        changing={changing}
        onChangePlan={handleChangePlan}
      />

      {upgradeModal && (
        <UpgradeModal data={upgradeModal} onClose={() => setUpgradeModal(null)} />
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
