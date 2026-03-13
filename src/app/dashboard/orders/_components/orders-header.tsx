"use client";

import Link from "next/link";
import {
  Search,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  Plus,
} from "lucide-react";
import { FeatureGate } from "@/components/feature-gate";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { OrdersCounts } from "@/types/orders";

interface OrdersHeaderProps {
  counts: OrdersCounts;
  refreshing: boolean;
  syncing: boolean;
  csvLoading: boolean;
  exportLoading: boolean;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  onRefresh: () => void;
  onCsvImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onOpenMobileSearch: () => void;
}

export function OrdersHeader({
  counts,
  refreshing,
  syncing,
  csvLoading,
  exportLoading,
  csvInputRef,
  onRefresh,
  onCsvImport,
  onExport,
  onOpenMobileSearch,
}: OrdersHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">
          {t("orders.title")}
        </h1>
        <p className="text-sm text-fog">
          {counts.all !== 1
            ? t("orders.totalCountPlural", { count: counts.all })
            : t("orders.totalCount", { count: counts.all })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* New manual order */}
        <Link
          href="/dashboard/orders/new"
          className="hidden sm:inline-flex items-center gap-2 rounded-sm bg-mint px-3 py-2 text-sm font-medium text-midnight shadow-sm hover:bg-mint-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("manualOrder.navButton")}
        </Link>
        <Link
          href="/dashboard/orders/new"
          className="sm:hidden h-10 w-10 flex items-center justify-center rounded-full bg-mint text-midnight shadow-sm hover:bg-mint-dark transition-colors"
          aria-label={t("manualOrder.navButton")}
        >
          <Plus className="h-4 w-4" />
        </Link>

        {/* Mobile search trigger */}
        <button
          onClick={onOpenMobileSearch}
          className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full border border-silk bg-white text-slate hover:bg-snow transition-colors"
          aria-label={t("orders.search.ariaLabel")}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface OrdersActionButtonsProps {
  refreshing: boolean;
  syncing: boolean;
  csvLoading: boolean;
  exportLoading: boolean;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  onRefresh: () => void;
  onCsvImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export function OrdersActionButtons({
  refreshing,
  syncing,
  csvLoading,
  exportLoading,
  csvInputRef,
  onRefresh,
  onCsvImport,
  onExport,
}: OrdersActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Refresh + Sync */}
      <button
        onClick={onRefresh}
        disabled={refreshing || syncing}
        className="h-9 w-9 lg:w-auto lg:px-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-silk bg-white text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50"
        aria-label={t("orders.refresh")}
        title={t("orders.refresh")}
      >
        <RefreshCw className={cn("h-4 w-4 shrink-0", (refreshing || syncing) && "animate-spin")} />
        {(refreshing || syncing) && (
          <span className="hidden lg:inline text-xs text-mist">
            {t("orders.sync.syncing")}
          </span>
        )}
      </button>

      {/* Import delivery CSV */}
      <button
        onClick={() => csvInputRef.current?.click()}
        disabled={csvLoading}
        className="h-9 w-9 lg:w-auto lg:px-3 inline-flex items-center justify-center gap-2 rounded-full border border-silk bg-white text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50"
        title="Importer livraisons (CSV)"
      >
        {csvLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 shrink-0" />
        )}
        <span className="hidden lg:inline">{t("orders.delivery.import")}</span>
      </button>
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={onCsvImport}
        className="hidden"
      />

      {/* Export CSV — Starter+ */}
      <FeatureGate feature="csv_export" mode="lock">
        <button
          onClick={onExport}
          disabled={exportLoading}
          className="h-9 w-9 lg:w-auto lg:px-3 inline-flex items-center justify-center gap-2 rounded-full border border-silk bg-white text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50"
        >
          {exportLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4 shrink-0" />
          )}
          <span className="hidden lg:inline">{t("orders.export.csv")}</span>
        </button>
      </FeatureGate>
    </div>
  );
}
