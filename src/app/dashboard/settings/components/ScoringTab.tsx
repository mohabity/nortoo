"use client";

import { useEffect, useState } from "react";
import {
  Sliders,
  Zap,
  ShieldAlert,
  Check,
  Loader2,
  Save,
  Play,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThresholdBar } from "@/components/dashboard/threshold-bar";
import { SCORING_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { SimulationPanel } from "./SimulationPanel";
import { FeatureGate } from "@/components/feature-gate";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import type { BaseTabProps } from "../types";

export function ScoringTab({ settings, onRefresh, onToast }: BaseTabProps) {
  const { t } = useTranslation();

  // Editable values
  const [verify, setVerify] = useState(settings.verifyThreshold);
  const [flag, setFlag] = useState(settings.flagThreshold);
  const [block, setBlock] = useState(settings.blockThreshold);
  const [autoBlock, setAutoBlock] = useState(settings.autoBlockEnabled);

  // Save state
  const [saving, setSaving] = useState(false);

  // Simulation state
  const [showSimulation, setShowSimulation] = useState(false);

  // Sync from parent when settings change
  useEffect(() => {
    setVerify(settings.verifyThreshold);
    setFlag(settings.flagThreshold);
    setBlock(settings.blockThreshold);
    setAutoBlock(settings.autoBlockEnabled);
  }, [settings]);

  // Has changes
  const hasChanges =
    verify !== settings.verifyThreshold ||
    flag !== settings.flagThreshold ||
    block !== settings.blockThreshold ||
    autoBlock !== settings.autoBlockEnabled;

  // Save
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifyThreshold: verify,
          flagThreshold: flag,
          blockThreshold: block,
          autoBlockEnabled: autoBlock,
        }),
      });
      if (res.ok) {
        await onRefresh();
        onToast("success", t("settings.scoring.saved"));
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        onToast("error", t("common.rateLimited", { seconds: retryAfter }));
      } else {
        onToast("error", t("settings.scoring.saveError"));
      }
    } catch {
      onToast("error", t("settings.scoring.saveError"));
    } finally {
      setSaving(false);
    }
  }

  // Apply preset
  function applyPreset(preset: keyof typeof SCORING_PRESETS) {
    const p = SCORING_PRESETS[preset];
    setVerify(p.verify);
    setFlag(p.flag);
    setBlock(p.block);
  }

  // Check active preset
  function isActivePreset(
    preset: (typeof SCORING_PRESETS)[keyof typeof SCORING_PRESETS]
  ) {
    return (
      verify === preset.verify && flag === preset.flag && block === preset.block
    );
  }

  // Slider clamping
  function handleVerifyChange(v: number) {
    const clamped = Math.min(v, flag - 1);
    setVerify(Math.max(10, clamped));
  }
  function handleFlagChange(v: number) {
    const clamped = Math.min(Math.max(v, verify + 1), block - 1);
    setFlag(clamped);
  }
  function handleBlockChange(v: number) {
    const clamped = Math.max(v, flag + 1);
    setBlock(Math.min(99, clamped));
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ═══ Seuils de scoring ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-ocean" />
            <div>
              <CardTitle className="text-base">{t("settings.scoring.thresholds")}</CardTitle>
              <CardDescription>
                {t("settings.scoring.thresholdsSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Threshold bar visualization */}
          <ThresholdBar verify={verify} flag={flag} block={block} />

          {/* Sliders */}
          <div className="space-y-5">
            {/* Verify slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate inline-flex items-center gap-1">
                    {t("settings.scoring.verifyThreshold")}
                    <HelpTooltip textKey="tooltips.threshold.verify" guideSection="parametres" />
                  </p>
                  <p className="text-xs text-mist">
                    {t("settings.scoring.verifyHint")}
                  </p>
                </div>
                <span className="font-mono text-lg font-bold text-amber w-10 text-right">
                  {verify}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={flag - 1}
                value={verify}
                onChange={(e) => handleVerifyChange(Number(e.target.value))}
                className="slider slider-amber w-full"
              />
            </div>

            {/* Flag slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate inline-flex items-center gap-1">
                    {t("settings.scoring.flagThreshold")}
                    <HelpTooltip textKey="tooltips.threshold.flag" guideSection="parametres" />
                  </p>
                  <p className="text-xs text-mist">
                    {t("settings.scoring.flagHint")}
                  </p>
                </div>
                <span className="font-mono text-lg font-bold text-rose w-10 text-right">
                  {flag}
                </span>
              </div>
              <input
                type="range"
                min={verify + 1}
                max={block - 1}
                value={flag}
                onChange={(e) => handleFlagChange(Number(e.target.value))}
                className="slider slider-rose w-full"
              />
            </div>

            {/* Block slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate inline-flex items-center gap-1">
                    {t("settings.scoring.blockThreshold")}
                    <HelpTooltip textKey="tooltips.threshold.block" guideSection="parametres" />
                  </p>
                  <p className="text-xs text-mist">
                    {t("settings.scoring.blockHint")}
                  </p>
                </div>
                <span className="font-mono text-lg font-bold text-violet w-10 text-right">
                  {block}
                </span>
              </div>
              <input
                type="range"
                min={flag + 1}
                max={99}
                value={block}
                onChange={(e) => handleBlockChange(Number(e.target.value))}
                className="slider slider-violet w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Préréglages ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">{t("settings.scoring.presets")}</CardTitle>
              <CardDescription>
                {t("settings.scoring.presetsSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(SCORING_PRESETS).map(([key, preset]) => {
              const active = isActivePreset(preset);
              return (
                <button
                  key={key}
                  onClick={() =>
                    applyPreset(key as keyof typeof SCORING_PRESETS)
                  }
                  className={cn(
                    "rounded-sm border p-4 text-left transition-all",
                    active
                      ? "border-mint ring-2 ring-mint/20 bg-mint-bg"
                      : "border-silk hover:bg-snow"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-midnight text-sm">
                      {t(`presets.${key}.name`)}
                    </p>
                    {active && <Check className="h-4 w-4 text-mint-deep" />}
                  </div>
                  <p className="mt-1 text-xs text-fog">
                    {t(`presets.${key}.description`)}
                  </p>
                  <p className="mt-2 font-mono text-xs text-mist">
                    {preset.verify} / {preset.flag} / {preset.block}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Simuler l'impact ═══ */}
      <FeatureGate feature="simulation" mode="upgrade">
        {!showSimulation && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowSimulation(true)}
            disabled={!hasChanges}
          >
            <Play className="mr-2 h-4 w-4" />
            {t("settings.scoring.simulate")}
          </Button>
        )}

        {showSimulation && (
          <SimulationPanel
            verify={verify}
            flag={flag}
            block={block}
            savedVerify={settings.verifyThreshold}
            savedFlag={settings.flagThreshold}
            savedBlock={settings.blockThreshold}
            onApply={async () => {
              await handleSave();
              setShowSimulation(false);
            }}
            onClose={() => setShowSimulation(false)}
          />
        )}
      </FeatureGate>

      {/* ═══ Auto-blocage ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-violet" />
            <div>
              <CardTitle className="text-base">{t("settings.scoring.autoBlock")}</CardTitle>
              <CardDescription>
                {t("settings.scoring.autoBlockSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate">
                {t("settings.scoring.autoBlockDescription", { threshold: String(block) })}
              </p>
              <p className="mt-1 text-xs text-mist">
                {t("settings.scoring.autoBlockDisabledHint")}
              </p>
            </div>
            <button
              onClick={() => setAutoBlock(!autoBlock)}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                autoBlock ? "bg-mint" : "bg-mist"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  autoBlock ? "translate-x-5" : ""
                )}
              />
            </button>
          </div>
          <div className="mt-3 rounded-xs bg-snow px-3 py-2">
            <p className="text-xs text-fog">
              {autoBlock
                ? t("settings.scoring.autoBlockActive")
                : t("settings.scoring.autoBlockInactive")
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Sticky Save Bar ═══ */}
      {!showSimulation && (
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
      )}

      {/* ── Slider CSS ── */}
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: #E2E8F0;
          outline: none;
          cursor: pointer;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .slider-amber::-webkit-slider-thumb {
          background: #f59e0b;
        }
        .slider-amber::-moz-range-thumb {
          background: #f59e0b;
        }
        .slider-rose::-webkit-slider-thumb {
          background: #F43F5E;
        }
        .slider-rose::-moz-range-thumb {
          background: #F43F5E;
        }
        .slider-violet::-webkit-slider-thumb {
          background: #8b5cf6;
        }
        .slider-violet::-moz-range-thumb {
          background: #8b5cf6;
        }
      `}</style>
    </div>
  );
}
