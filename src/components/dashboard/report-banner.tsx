"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";

/**
 * Shows a "rapport prêt" banner during the first 7 days of each month.
 * Dismiss persists in localStorage per month.
 */
export function ReportBanner() {
  const [visible, setVisible] = useState(false);
  const [monthLabel, setMonthLabel] = useState("");
  const { t, locale } = useTranslation();

  useEffect(() => {
    const now = new Date();
    const day = now.getDate();

    // Only show during days 1-7 of the month
    if (day > 7) return;

    // Previous month label
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const label = formatDate(prev, locale, {
      month: "long",
      year: "numeric",
    });

    // Check dismissal for this month
    const key = `nortoo_dismiss_report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (localStorage.getItem(key)) return;

    setMonthLabel(label);
    setVisible(true);
  }, [locale]);

  function dismiss() {
    setVisible(false);
    const now = new Date();
    const key = `nortoo_dismiss_report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    localStorage.setItem(key, "1");
  }

  if (!visible) return null;

  return (
    <div className="mx-4 lg:mx-6 mt-4 flex items-center gap-3 rounded-sm border border-ocean/30 bg-ocean-bg px-4 py-3 shadow-sm animate-in slide-in-from-top-2">
      <FileText className="h-5 w-5 flex-shrink-0 text-ocean" />
      <p className="flex-1 text-sm font-medium text-ocean">
        {t("components.banners.reportReady", { month: monthLabel })}
      </p>
      <a
        href="/dashboard/analytics"
        className="text-sm font-semibold text-ocean hover:underline shrink-0"
      >
        {t("components.banners.reportDownload")}
      </a>
      <button
        onClick={dismiss}
        className="rounded-xs p-1 text-ocean/60 hover:bg-ocean/20 hover:text-ocean transition-colors"
        aria-label={t("common.close")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
