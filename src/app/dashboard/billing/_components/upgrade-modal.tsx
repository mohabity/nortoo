"use client";

import { CheckCircle, Info, X } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";
import type { UpgradeConfirmation } from "./billing-types";
import { formatAmountDH } from "./billing-types";

interface UpgradeModalProps {
  data: UpgradeConfirmation;
  onClose: () => void;
}

export function UpgradeModal({ data, onClose }: UpgradeModalProps) {
  const { locale } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/50 backdrop-blur-sm">
      <div className="bg-white rounded-sm border border-silk shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between bg-mint/5 border-b border-mint/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-mint-deep" />
            <h3 className="font-display text-lg font-semibold text-midnight">
              Demande d&apos;upgrade enregistrée
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-fog hover:text-midnight transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-slate">
            Votre demande de passage au plan <span className="font-bold text-midnight">{data.planName}</span> a été enregistrée.
            Les coordonnées bancaires vous seront envoyées par email avec la facture.
          </p>

          {/* Invoice summary */}
          <div className="rounded-sm bg-snow border border-silk p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-fog">Facture</span>
              <span className="text-sm font-mono font-medium text-midnight">{data.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-fog">Montant HT</span>
              <span className="text-sm text-midnight">{formatAmountDH(data.amountHT)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-fog">TVA (20%)</span>
              <span className="text-sm text-midnight">{formatAmountDH(data.amountTVA)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-silk pt-2">
              <span className="text-xs font-medium text-midnight">Total TTC</span>
              <span className="font-display text-lg font-bold text-midnight">{formatAmountDH(data.amountTTC)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-fog">Échéance</span>
              <span className="text-xs text-mist">{formatDate(data.dueDate, locale)}</span>
            </div>
          </div>

          {/* Reference reminder */}
          <div className="flex items-center gap-2 rounded-sm bg-sun/5 border border-sun/20 px-3 py-2">
            <Info className="h-3.5 w-3.5 text-sun-deep shrink-0" />
            <p className="text-xs text-sun-deep">
              Indiquez <span className="font-mono font-bold">{data.invoiceNumber}</span> en référence de votre virement.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-silk bg-snow/50">
          <button
            onClick={onClose}
            className="w-full rounded-sm bg-midnight px-4 py-2.5 text-sm font-medium text-white hover:bg-midnight/90 transition-colors"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
