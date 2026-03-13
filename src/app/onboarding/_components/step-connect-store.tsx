"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";

export function StepConnectStore({
  storeConnected,
  onNext,
  onSkip,
}: {
  storeConnected: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const [autoAdvance, setAutoAdvance] = useState(false);

  useEffect(() => {
    if (storeConnected && !autoAdvance) {
      setAutoAdvance(true);
      const timer = setTimeout(onNext, 1500);
      return () => clearTimeout(timer);
    }
  }, [storeConnected, autoAdvance, onNext]);

  if (storeConnected) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="h-12 w-12 text-mint-deep mx-auto" />
        <h2 className="font-display text-lg font-bold text-mint-deep">
          {t("onboarding.connect.connected")}
        </h2>
        <p className="text-sm text-fog">{t("onboarding.connect.redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-5">
      <div className="text-5xl">{"🏪"}</div>
      <div>
        <h2 className="font-display text-xl font-bold text-midnight">
          {t("onboarding.connect.title")}
        </h2>
        <p className="mt-2 text-sm text-fog">
          {t("onboarding.connect.subtitle")}
        </p>
      </div>

      <div>
        <a href="/api/auth/youcan">
          <Button className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5">
            {t("onboarding.connect.cta")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-fog">
          {t("onboarding.connect.noYoucan")}{" "}
          <button onClick={onNext} className="text-ocean hover:underline">
            {t("onboarding.connect.manualApi")}
          </button>
        </p>
        <p className="font-mono text-[0.55rem] text-mist">
          {t("onboarding.connect.secureOauth")}
        </p>
        <button
          onClick={onSkip}
          className="text-xs text-mist hover:text-fog transition-colors"
        >
          {t("onboarding.skipStep")}
        </button>
        <p className="text-[11px] text-mist">
          {t("onboarding.connectLater")}
        </p>
      </div>
    </div>
  );
}
