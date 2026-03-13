"use client";

import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { Invoice } from "./billing-types";
import { formatAmountDH, STATUS_STYLES, STATUS_LABELS } from "./billing-types";

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-sm border border-silk bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-fog" />
        <h2 className="font-display text-base font-semibold text-midnight">{t("billing.invoices.title")}</h2>
      </div>
      {invoices.length === 0 ? (
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
              {invoices.map((inv) => (
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
  );
}
