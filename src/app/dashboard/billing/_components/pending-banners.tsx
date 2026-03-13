"use client";

import { Loader2, Info, X, CreditCard, ArrowDownCircle } from "lucide-react";
import { PLAN_CONFIGS, type PlanId } from "@/lib/plans";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";
import type { PendingUpgrade, PlanApiData } from "./billing-types";
import { formatAmountDH } from "./billing-types";

interface PendingUpgradeBannerProps {
  pendingUpgrade: PendingUpgrade;
}

export function PendingUpgradeBanner({ pendingUpgrade }: PendingUpgradeBannerProps) {
  const { locale } = useTranslation();

  if (!pendingUpgrade.pending || !pendingUpgrade.invoice) return null;

  return (
    <div className="rounded-sm border-2 border-ocean/30 bg-ocean/5 p-6">
      <div className="flex items-start gap-3">
        <CreditCard className="h-5 w-5 text-ocean shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="font-display text-base font-semibold text-midnight">
            Upgrade en attente — Plan {pendingUpgrade.invoice.planName}
          </h2>
          <p className="text-sm text-fog mt-1">
            Effectuez le virement pour activer votre plan. Les coordonnées bancaires vous ont été envoyées par email avec la facture.
          </p>

          <div className="mt-4">
            <div className="rounded-sm bg-white border border-silk p-4 space-y-2 max-w-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-fog">Facture</span>
                <span className="text-sm font-mono text-midnight">{pendingUpgrade.invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-fog">Montant HT</span>
                <span className="text-sm text-midnight">{formatAmountDH(pendingUpgrade.invoice.amountHT)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-fog">TVA (20%)</span>
                <span className="text-sm text-midnight">{formatAmountDH(pendingUpgrade.invoice.amountTVA)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-silk pt-2">
                <span className="text-xs font-medium text-midnight">Total TTC</span>
                <span className="text-sm font-bold text-midnight">{formatAmountDH(pendingUpgrade.invoice.amountTTC)}</span>
              </div>
              {pendingUpgrade.invoice.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-fog">Échéance</span>
                  <span className="text-xs text-mist">{formatDate(pendingUpgrade.invoice.dueDate, locale)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-sm bg-sun/5 border border-sun/20 px-3 py-2">
            <Info className="h-3.5 w-3.5 text-sun-deep shrink-0" />
            <p className="text-xs text-sun-deep">
              Indiquez <span className="font-mono font-bold">{pendingUpgrade.invoice.invoiceNumber}</span> en référence de votre virement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PendingDowngradeBannerProps {
  planData: PlanApiData;
  onCancelDowngrade: () => void;
  cancelling: boolean;
}

export function PendingDowngradeBanner({ planData, onCancelDowngrade, cancelling }: PendingDowngradeBannerProps) {
  if (!planData.pendingPlanDowngrade) return null;

  return (
    <div className="rounded-sm border-2 border-sun/30 bg-sun/5 p-6">
      <div className="flex items-start gap-3">
        <ArrowDownCircle className="h-5 w-5 text-sun-deep shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="font-display text-base font-semibold text-midnight">
            Rétrogradation planifiée — Plan {PLAN_CONFIGS[planData.pendingPlanDowngrade as PlanId]?.name ?? planData.pendingPlanDowngrade}
          </h2>
          <p className="text-sm text-fog mt-1">
            Votre plan sera rétrogradé vers <span className="font-semibold text-midnight">{PLAN_CONFIGS[planData.pendingPlanDowngrade as PlanId]?.name ?? planData.pendingPlanDowngrade}</span> au prochain mois de facturation.
            Vous conservez toutes les fonctionnalités de votre plan actuel jusqu&apos;à la fin du mois.
          </p>
          <button
            onClick={onCancelDowngrade}
            disabled={cancelling}
            className="mt-3 inline-flex items-center gap-2 rounded-sm border border-sun/40 bg-white px-4 py-2 text-sm font-medium text-sun-deep hover:bg-sun/5 transition-colors disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Annuler la rétrogradation
          </button>
        </div>
      </div>
    </div>
  );
}
