"use client";

import type { CustomerData } from "@/types/orders";

// ── Props ──

interface CustomerHistoryProps {
  customer: CustomerData;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// ── Component ──

export function CustomerHistory({ customer, t }: CustomerHistoryProps) {
  return (
    <div className="mx-6 mt-4">
      <h3 className="text-sm font-semibold text-midnight font-display mb-2">
        {t("components.orderSlideOver.clientHistory")}
      </h3>
      <div className="rounded-lg border border-silk bg-snow p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-mono text-xl font-bold text-midnight">
              {customer.totalOrders}
            </p>
            <p className="text-[11px] text-mist">{t("components.orderSlideOver.historyOrders")}</p>
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-mint-deep">
              {customer.successfulOrders}
            </p>
            <p className="text-[11px] text-mist">{t("components.orderSlideOver.historySuccess")}</p>
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-rose">
              {customer.failedOrders}
            </p>
            <p className="text-[11px] text-mist">{t("components.orderSlideOver.historyFailures")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
