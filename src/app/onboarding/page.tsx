"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { useOnboardingWizard } from "@/hooks/use-onboarding-wizard";
import { ProgressDots } from "./_components/progress-dots";
import { StepWelcome } from "./_components/step-welcome";
import { StepConnectStore } from "./_components/step-connect-store";
import { StepConfigureScoring } from "./_components/step-configure-scoring";
import { StepTestWebhook } from "./_components/step-test-webhook";
import { StepDashboardReady } from "./_components/step-dashboard-ready";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-snow">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}

function OnboardingWizard() {
  const { t } = useTranslation();
  const {
    state,
    step,
    direction,
    animating,
    loading,
    selectedPreset,
    setSelectedPreset,
    testState,
    testResult,
    testError,
    testPhase,
    persistStep,
    goToStep,
    next,
    handlePresetContinue,
    handleTestWebhook,
    handleFinish,
    handleSkipAll,
  } = useOnboardingWizard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-snow">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-snow px-4 py-8">
      {/* Logo */}
      <div className="mb-8">
        <img src="/nortoo-logo.png" alt="nortoo" className="h-9 w-auto" />
      </div>

      {/* Card */}
      <div className="w-full max-w-[560px]">
        <ProgressDots currentStep={step} />

        {/* Card body */}
        <div className="relative overflow-hidden rounded-xl border border-silk bg-white p-6 sm:p-8 shadow-sm">
          <div
            className={cn(
              "transition-all duration-200 ease-out",
              animating && direction === "left" && "opacity-0 -translate-x-4",
              animating && direction === "right" && "opacity-0 translate-x-4",
              !animating && "opacity-100 translate-x-0"
            )}
          >
            {step === 1 && (
              <StepWelcome
                name={state?.merchantName ?? ""}
                onNext={(consent) => {
                  persistStep(1, { consent });
                  goToStep(2);
                }}
              />
            )}
            {step === 2 && (
              <StepConnectStore
                storeConnected={state?.storeConnected ?? false}
                onNext={next}
                onSkip={() => {
                  persistStep(2);
                  goToStep(3);
                }}
              />
            )}
            {step === 3 && (
              <StepConfigureScoring
                selectedPreset={selectedPreset}
                onSelectPreset={setSelectedPreset}
                onContinue={handlePresetContinue}
                onSkip={handlePresetContinue}
              />
            )}
            {step === 4 && (
              <StepTestWebhook
                testState={testState}
                testResult={testResult}
                testError={testError}
                testPhase={testPhase}
                onTest={handleTestWebhook}
                onNext={() => {
                  persistStep(4);
                  goToStep(5);
                }}
                onSkip={() => {
                  persistStep(4);
                  goToStep(5);
                }}
              />
            )}
            {step === 5 && <StepDashboardReady onFinish={handleFinish} />}
          </div>
        </div>

        {/* Skip all */}
        <div className="mt-4 text-center">
          <button
            onClick={handleSkipAll}
            className="text-xs text-mist hover:text-fog transition-colors"
          >
            {t("onboarding.skipAll")}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-mist">
          {t("onboarding.hostedInEU")}
        </p>
      </div>
    </div>
  );
}
