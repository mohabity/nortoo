"use client";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

export interface TestResult {
  score: number;
  decision: string;
  testOrder: {
    ref: string;
    customer: string;
    city: string;
    product: string;
    total: number;
  };
  durationMs: number;
  confidence: number;
}

const DECISION_COLORS: Record<string, string> = {
  ship: "text-mint-deep",
  verify: "text-sun-deep",
  flag: "text-coral",
  block: "text-violet",
};

export function StepTestWebhook({
  testState,
  testResult,
  testError,
  testPhase,
  onTest,
  onNext,
  onSkip,
}: {
  testState: "idle" | "loading" | "success" | "error";
  testResult: TestResult | null;
  testError: string | null;
  testPhase: number;
  onTest: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();

  const decisionLabels: Record<string, string> = {
    ship: t("onboarding.decision.ship"),
    verify: t("onboarding.decision.verify"),
    flag: t("onboarding.decision.flag"),
    block: t("onboarding.decision.block"),
  };

  const phases = [
    t("onboarding.test.phase1"),
    testResult
      ? t("onboarding.test.phase2").replace("{score}", String(testResult.score))
      : t("onboarding.test.phase2Loading"),
    testResult
      ? t("onboarding.test.phase3").replace("{decision}", decisionLabels[testResult.decision] || testResult.decision)
      : t("onboarding.test.phase3Loading"),
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">{"🧪"}</div>
        <h2 className="font-display text-xl font-bold text-midnight">
          {t("onboarding.test.title")}
        </h2>
        <p className="mt-2 text-sm text-fog">
          {t("onboarding.test.subtitle")}
        </p>
      </div>

      {/* Idle */}
      {testState === "idle" && (
        <div className="text-center">
          <Button
            onClick={onTest}
            className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
          >
            {t("onboarding.test.cta")}
          </Button>
        </div>
      )}

      {/* Loading with staggered phases */}
      {testState === "loading" && (
        <div className="space-y-3 rounded-lg border border-silk bg-snow p-4">
          {phases.map((label, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2.5 transition-all duration-300",
                testPhase > i
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-3"
              )}
            >
              {testPhase > i ? (
                <CheckCircle2 className="h-4 w-4 text-mint-deep shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-mist shrink-0" />
              )}
              <span className="text-sm text-slate">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success */}
      {testState === "success" && testResult && (
        <div className="space-y-4">
          <div className="rounded-lg border border-mint bg-mint-bg/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-mint-deep" />
              <span className="text-sm font-semibold text-mint-deep">
                {t("onboarding.test.successDuration").replace("{ms}", String(testResult.durationMs))}
              </span>
            </div>

            <div className="rounded-lg border border-silk bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-fog">
                  {t("onboarding.test.orderRef").replace("{ref}", testResult.testOrder.ref)}
                </span>
                <span className="font-mono text-sm font-bold text-midnight">
                  {testResult.score}/100
                </span>
              </div>
              <div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    DECISION_COLORS[testResult.decision] || "text-slate"
                  )}
                >
                  {"✅"} {decisionLabels[testResult.decision] || testResult.decision}
                </span>
              </div>
              <p className="text-xs text-fog">
                {t("onboarding.test.client")}: {testResult.testOrder.customer} ·{" "}
                {testResult.testOrder.city}
              </p>
              <p className="text-xs text-fog">
                {t("onboarding.test.amount")}: {testResult.testOrder.total} DH
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={onNext}
              className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
            >
              {t("onboarding.test.continue")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {testState === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-rose bg-rose-bg/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-rose" />
              <span className="text-sm font-semibold text-rose">
                {t("onboarding.test.failed")}
              </span>
            </div>
            <p className="text-xs text-fog">{testError}</p>
          </div>
          <div className="text-center">
            <Button onClick={onTest} variant="outline" className="w-full max-w-[320px]">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("onboarding.test.retry")}
            </Button>
          </div>
        </div>
      )}

      {/* Skip */}
      {(testState === "idle" || testState === "error") && (
        <div className="text-center">
          <button onClick={onSkip} className="text-xs text-mist hover:text-fog">
            {t("onboarding.test.skip")}
          </button>
        </div>
      )}
    </div>
  );
}
