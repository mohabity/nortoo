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
import { useTranslation } from "@/i18n/provider";
import { formatCurrency } from "@/lib/i18n-utils";
import type { BaseTabProps } from "../types";

export function RtoCostsTab({ settings, onRefresh, onToast }: BaseTabProps) {
  const { t, locale } = useTranslation();
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
        onToast("success", t("settings.rtoCosts.saved"));
      } else {
        onToast("error", t("settings.rtoCosts.saveError"));
      }
    } catch {
      onToast("error", t("settings.rtoCosts.saveError"));
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
                {t("settings.rtoCosts.returnCost")}
              </CardTitle>
              <CardDescription>
                {t("settings.rtoCosts.returnCostSubtitle")}
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
                  {t("settings.rtoCosts.fixedCost")}
                </p>
                <p className="text-xs text-mist">
                  {t("settings.rtoCosts.fixedCostHint")}
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
                  {t("settings.rtoCosts.variableCost")}
                </p>
                <p className="text-xs text-mist">
                  {t("settings.rtoCosts.variableCostHint")}
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
          <CardTitle className="text-base">{t("settings.rtoCosts.preview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-sm bg-snow border border-silk p-4">
            <p className="text-sm text-slate">
              {t("settings.rtoCosts.example", { amount: formatCurrency(exampleAmount, locale) })}
            </p>
            <p className="mt-2 text-lg font-display font-bold text-midnight">
              {t("settings.rtoCosts.estimatedCost")} ={" "}
              <span className="text-amber">
                {formatCurrency(previewCost, locale)}
              </span>
            </p>
            <p className="mt-1 text-xs text-mist">
              {formatCurrency(fixedCost, locale)} ({t("settings.rtoCosts.fixed")}) + {exampleAmount} × {variablePercent}%
              = {formatCurrency(exampleAmount * (variablePercent / 100), locale)}
              ({t("settings.rtoCosts.variable")})
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
                {t("settings.scoring.unsavedChanges")}
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
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
