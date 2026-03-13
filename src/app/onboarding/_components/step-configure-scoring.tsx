"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

export type PresetKey = "permissive" | "balanced" | "conservative";

export function StepConfigureScoring({
  selectedPreset,
  onSelectPreset,
  onContinue,
  onSkip,
}: {
  selectedPreset: PresetKey;
  onSelectPreset: (key: PresetKey) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();

  const presets: {
    key: PresetKey;
    emoji: string;
    label: string;
    recommended?: boolean;
    description: string;
    thresholds: string;
  }[] = [
    {
      key: "permissive",
      emoji: "🟢",
      label: t("onboarding.scoring.permissive"),
      description: t("onboarding.scoring.permissiveDesc"),
      thresholds: t("onboarding.scoring.permissiveThresholds"),
    },
    {
      key: "balanced",
      emoji: "🟡",
      label: t("onboarding.scoring.balanced"),
      recommended: true,
      description: t("onboarding.scoring.balancedDesc"),
      thresholds: t("onboarding.scoring.balancedThresholds"),
    },
    {
      key: "conservative",
      emoji: "🔴",
      label: t("onboarding.scoring.conservative"),
      description: t("onboarding.scoring.conservativeDesc"),
      thresholds: t("onboarding.scoring.conservativeThresholds"),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">{"⚙️"}</div>
        <h2 className="font-display text-xl font-bold text-midnight">
          {t("onboarding.scoring.title")}
        </h2>
        <p className="mt-2 text-sm text-fog">
          {t("onboarding.scoring.subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {presets.map((p) => {
          const isSelected = selectedPreset === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onSelectPreset(p.key)}
              className={cn(
                "w-full text-left rounded-xl border-2 p-4 transition-all",
                isSelected
                  ? "border-mint bg-mint-bg/30"
                  : "border-silk hover:border-mist hover:shadow-sm"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span className="text-sm font-semibold text-midnight">
                      {p.label}
                    </span>
                    {p.recommended && (
                      <span className="text-[10px] font-medium bg-mint-bg text-mint-deep px-1.5 py-0.5 rounded">
                        {t("onboarding.scoring.recommended")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-fog">{p.description}</p>
                  <p className="mt-1.5 font-mono text-[11px] text-mist">
                    {p.thresholds}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-mint-deep shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center space-y-2">
        <Button
          onClick={onContinue}
          className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
        >
          {t("onboarding.scoring.continue")} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button onClick={onSkip} className="text-xs text-mist hover:text-fog block mx-auto">
          {t("onboarding.scoring.keepDefaults")}
        </button>
      </div>
    </div>
  );
}
