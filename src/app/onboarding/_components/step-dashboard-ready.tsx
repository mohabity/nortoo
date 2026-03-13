"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";

export function StepDashboardReady({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-5">
      <div className="text-5xl">{"🎉"}</div>
      <div>
        <h2 className="font-display text-xl font-bold text-midnight">
          {t("onboarding.ready.title")}
        </h2>
        <p className="mt-2 text-sm text-fog">
          {t("onboarding.ready.subtitle")}
        </p>
      </div>

      {/* Tips */}
      <div className="text-left space-y-3 rounded-lg bg-snow border border-silk p-4">
        {[
          t("onboarding.ready.tip1"),
          t("onboarding.ready.tip2"),
          t("onboarding.ready.tip3"),
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-sm shrink-0">{"💡"}</span>
            <p className="text-[0.82rem] text-slate">{tip}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Button
          onClick={onFinish}
          className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
        >
          {t("onboarding.ready.cta")} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <a
          href="/dashboard/settings"
          className="inline-block text-xs text-mist hover:text-fog"
        >
          {t("onboarding.ready.customize")}
        </a>
      </div>
    </div>
  );
}
