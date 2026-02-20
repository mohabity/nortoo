"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, Save } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BaseTabProps } from "../types";

export function RtoCostsTab({ settings, onRefresh, onToast }: BaseTabProps) {
  const [fixedCost, setFixedCost] = useState(settings.rtoCostFixed);
  const [variablePercent, setVariablePercent] = useState(
    Math.round(settings.rtoCostPercent * 100)
  );
  const [saving, setSaving] = useState(false);

  // Sync from parent
  useEffect(() => {
    setFixedCost(settings.rtoCostFixed);
    setVariablePercent(Math.round(settings.rtoCostPercent * 100));
  }, [settings]);

  const hasChanges =
    fixedCost !== settings.rtoCostFixed ||
    variablePercent !== Math.round(settings.rtoCostPercent * 100);

  // Live preview with 350 DH example
  const exampleAmount = 350;
  const previewCost = fixedCost + exampleAmount * (variablePercent / 100);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rtoCostFixed: fixedCost,
          rtoCostPercent: variablePercent / 100,
        }),
      });
      if (res.ok) {
        await onRefresh();
        onToast("success", "Co\u00FBts RTO sauvegard\u00E9s");
      } else {
        onToast("error", "Erreur lors de la sauvegarde");
      }
    } catch {
      onToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ═══ Coût d'un retour ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber" />
            <div>
              <CardTitle className="text-base">
                Co\u00FBt d&apos;un retour (RTO)
              </CardTitle>
              <CardDescription>
                Ces valeurs sont utilis\u00E9es pour calculer les \u00E9conomies
                estim\u00E9es sur votre tableau de bord
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Fixed cost */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate">
                  Co\u00FBt fixe par retour
                </p>
                <p className="text-xs text-mist">
                  Frais de livraison aller-retour, manutention, etc.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={fixedCost}
                  onChange={(e) =>
                    setFixedCost(
                      Math.max(0, Math.min(500, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-20 rounded-sm border border-silk bg-white px-3 py-1.5 text-right font-mono text-sm text-midnight focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean/30"
                />
                <span className="text-sm text-fog">DH</span>
              </div>
            </div>
          </div>

          {/* Variable cost */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate">
                  Co\u00FBt variable
                </p>
                <p className="text-xs text-mist">
                  Pourcentage du montant de la commande (marge perdue, frais
                  stock)
                </p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={variablePercent}
                  onChange={(e) =>
                    setVariablePercent(
                      Math.max(0, Math.min(50, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-20 rounded-sm border border-silk bg-white px-3 py-1.5 text-right font-mono text-sm text-midnight focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean/30"
                />
                <span className="text-sm text-fog">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Live Preview ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aper\u00E7u</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-sm bg-snow border border-silk p-4">
            <p className="text-sm text-slate">
              Exemple : commande de{" "}
              <span className="font-mono font-bold">{exampleAmount} DH</span>
            </p>
            <p className="mt-2 text-lg font-display font-bold text-midnight">
              Co\u00FBt RTO estim\u00E9 ={" "}
              <span className="text-amber">
                {Math.round(previewCost)} DH
              </span>
            </p>
            <p className="mt-1 text-xs text-mist">
              {fixedCost} DH (fixe) + {exampleAmount} \u00D7 {variablePercent}%
              = {Math.round(exampleAmount * (variablePercent / 100))} DH
              (variable)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Sticky Save Bar ═══ */}
      <div className="sticky bottom-0 border-t border-silk bg-white/80 backdrop-blur-sm px-6 py-4 -mx-1 rounded-b">
        <div className="flex items-center justify-between">
          <div>
            {hasChanges && (
              <p className="text-sm text-fog">
                Modifications non sauvegard\u00E9es
              </p>
            )}
          </div>
          <Button
            disabled={!hasChanges || saving}
            onClick={handleSave}
            className="min-w-[160px]"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}
