"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";

export function StepWelcome({
  name,
  onNext,
}: {
  name: string;
  onNext: (consent: boolean) => void;
}) {
  const { t } = useTranslation();
  const [consentChecked, setConsentChecked] = useState(false);
  const [showError, setShowError] = useState(false);

  function handleNext() {
    if (!consentChecked) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onNext(true);
  }

  return (
    <div className="text-center space-y-5">
      <div className="text-5xl">{"🎯"}</div>
      <div>
        <h2 className="font-display text-xl sm:text-[1.4rem] font-bold text-midnight">
          {name
            ? t("onboarding.welcome.titleWithName").replace("{name}", name)
            : t("onboarding.welcome.title")}
        </h2>
        <p className="mt-2 text-sm text-fog">
          {t("onboarding.welcome.subtitle")}
        </p>
      </div>

      {/* Mini features */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { emoji: "🔍", label: t("onboarding.welcome.featureScore") },
          { emoji: "📊", label: t("onboarding.welcome.featureDashboard") },
          { emoji: "🛡️", label: t("onboarding.welcome.featureAntifraud") },
        ].map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-1.5 rounded-lg border border-silk bg-white px-3 py-1.5"
          >
            <span className="text-sm">{f.emoji}</span>
            <span className="text-xs font-medium text-slate">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Consent checkbox — Loi 09-08 Art. 5 */}
      <div className="text-left max-w-[360px] mx-auto">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => {
              setConsentChecked(e.target.checked);
              if (e.target.checked) setShowError(false);
            }}
            className="mt-0.5 h-4 w-4 rounded border-silk accent-mint shrink-0"
          />
          <span className="text-xs text-slate leading-relaxed">
            {t("onboarding.consentLabel")}{" "}
            <a href="/privacy" target="_blank" className="text-ocean hover:underline">
              {t("onboarding.consentPrivacyLink")}
            </a>
          </span>
        </label>
        {showError && (
          <p className="mt-1.5 ml-6.5 text-[11px] text-rose">
            {t("onboarding.consentRequired")}
          </p>
        )}
      </div>

      <div>
        <Button
          onClick={handleNext}
          className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
        >
          {t("onboarding.welcome.cta")} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="mt-2 font-mono text-[0.55rem] text-mist">
          {t("onboarding.welcome.setupTime")}
        </p>
      </div>
    </div>
  );
}
