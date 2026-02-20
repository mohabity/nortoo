"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, ShieldBan, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecisionBadge } from "./decision-badge";
import { formatDH, cn } from "@/lib/utils";
import type { OrderRow } from "./order-table";

interface BulkConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "SHIP" | "BLOCK";
  selectedOrders: OrderRow[];
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}

const DECISION_KEYS = ["ship", "verify", "flag", "block"] as const;

export function BulkConfirmModal({
  open,
  onOpenChange,
  action,
  selectedOrders,
  onConfirm,
  isSubmitting,
}: BulkConfirmModalProps) {
  const [reason, setReason] = useState("");

  const isShip = action === "SHIP";
  const count = selectedOrders.length;
  const totalAmount = selectedOrders.reduce((sum, o) => sum + o.total, 0);

  // Group orders by their current effective decision
  const breakdown = new Map<string, { count: number; total: number }>();
  for (const order of selectedOrders) {
    const decision = order.overrideDecision ?? order.decision;
    const existing = breakdown.get(decision) ?? { count: 0, total: 0 };
    existing.count++;
    existing.total += order.total;
    breakdown.set(decision, existing);
  }

  function handleConfirm() {
    onConfirm(reason.trim());
    setReason("");
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                isShip ? "bg-mint-bg" : "bg-rose-bg"
              )}
            >
              {isShip ? (
                <CheckCircle2 className="h-5 w-5 text-mint-deep" />
              ) : (
                <ShieldBan className="h-5 w-5 text-rose" />
              )}
            </div>
            <Dialog.Title className="font-display font-semibold text-midnight text-lg">
              {isShip
                ? `Forcer l'expédition de ${count} commande${count > 1 ? "s" : ""}`
                : `Bloquer ${count} commande${count > 1 ? "s" : ""}`}
            </Dialog.Title>
          </div>

          <Dialog.Description className="text-sm text-fog mb-5">
            {isShip
              ? `Ces commandes seront marquées comme "Override — Expédition forcée" et ne seront plus bloquées par le scoring automatique.`
              : `Ces commandes seront marquées comme "Override — Blocage forcé". Elles ne seront pas expédiées.`}
          </Dialog.Description>

          {/* Reason textarea */}
          <div className="mb-5">
            <label className="text-sm font-medium text-slate block mb-1.5">
              Raison (optionnel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ex: Client confirmé par téléphone"
              className="w-full rounded-lg border border-silk bg-snow px-3 py-2 text-sm text-slate placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 resize-none"
            />
          </div>

          {/* Summary breakdown */}
          <div className="mb-5 rounded-lg border border-silk bg-snow p-4 space-y-2">
            <p className="text-xs font-medium text-mist uppercase tracking-wider mb-2">
              Résumé
            </p>
            {DECISION_KEYS.map((key) => {
              const entry = breakdown.get(key);
              if (!entry) return null;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <DecisionBadge decision={key} size="sm" />
                    <span className="text-fog">
                      {entry.count} commande{entry.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="font-mono text-slate">
                    {formatDH(entry.total)}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-silk pt-2 mt-2 flex items-center justify-between text-sm font-medium">
              <span className="text-midnight">Montant total</span>
              <span className="font-mono text-midnight">
                {formatDH(totalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={cn(
                isShip
                  ? "bg-mint hover:bg-mint-deep text-[#0B0F1A]"
                  : "bg-rose hover:bg-rose/90 text-white"
              )}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isShip ? "Confirmer l'expédition" : "Confirmer le blocage"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
