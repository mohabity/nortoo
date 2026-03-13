"use client";

import { Loader2, Save } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import type { BillingInfo } from "./billing-types";

interface BillingInfoFormProps {
  billingInfo: BillingInfo;
  onChange: (info: BillingInfo) => void;
  onSave: () => void;
  saving: boolean;
}

export function BillingInfoForm({ billingInfo, onChange, onSave, saving }: BillingInfoFormProps) {
  const { t } = useTranslation();

  return (
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
            onChange={(e) => onChange({ ...billingInfo, billingName: e.target.value })}
            placeholder={t("billing.billingInfo.companyNamePlaceholder")}
            className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-fog mb-1 block">{t("billing.billingInfo.ice")}</label>
          <input
            type="text"
            value={billingInfo.billingICE || ""}
            onChange={(e) => onChange({ ...billingInfo, billingICE: e.target.value })}
            placeholder="00000000000000"
            className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-fog mb-1 block">{t("billing.billingInfo.address")}</label>
          <input
            type="text"
            value={billingInfo.billingAddress || ""}
            onChange={(e) => onChange({ ...billingInfo, billingAddress: e.target.value })}
            placeholder={t("billing.billingInfo.addressPlaceholder")}
            className="w-full rounded-sm border border-silk bg-white px-3 py-2 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 rounded-sm bg-mint px-4 py-2 text-sm font-medium text-midnight hover:bg-mint-dark transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t("billing.billingInfo.save")}
      </button>
    </div>
  );
}
