"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

// ── Types ──

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  merchantName: string;
  storeConnected: boolean;
  scoringConfigured: boolean;
  testOrderSent: boolean;
  realOrderCount: number;
}

interface TestResult {
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

type PresetKey = "permissive" | "balanced" | "conservative";

const STEP_COUNT = 5;

const DECISION_COLORS: Record<string, string> = {
  ship: "text-mint-deep",
  verify: "text-sun-deep",
  flag: "text-coral",
  block: "text-violet",
};

// ── Main page ──

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const urlStep = searchParams.get("step");
  const connected = searchParams.get("connected");

  const [state, setState] = useState<OnboardingState | null>(null);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Step-specific state
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("balanced");
  const [testState, setTestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testPhase, setTestPhase] = useState(0);

  // Fetch onboarding state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding");
      if (!res.ok) return;
      const json = await res.json();
      setState(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Determine initial step from state/URL
  useEffect(() => {
    if (!state) return;

    if (state.completed) {
      router.replace("/dashboard");
      return;
    }

    // If returning from OAuth (connected=true), go to step 3
    if (connected === "true") {
      setStep(3);
      persistStep(2);
      return;
    }

    // URL param override
    if (urlStep) {
      const parsed = parseInt(urlStep, 10);
      if (parsed >= 1 && parsed <= STEP_COUNT) {
        setStep(parsed);
        return;
      }
    }

    // Resume from saved step
    if (state.currentStep >= 1 && state.currentStep < 6) {
      const resumeTo = Math.min(state.currentStep + 1, STEP_COUNT);
      // Auto-skip step 2 if store is already connected
      if (resumeTo === 2 && state.storeConnected) {
        setStep(3);
      } else {
        setStep(resumeTo);
      }
      return;
    }

    // Step 1, but auto-skip step 2 check for fresh starts
    if (state.storeConnected && step === 2) {
      setStep(3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, connected, urlStep]);

  async function persistStep(s: number, data?: Record<string, unknown>) {
    try {
      await fetch("/api/onboarding/step", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: s, data }),
      });
    } catch {
      // non-critical
    }
  }

  function goToStep(target: number) {
    if (animating) return;
    setDirection(target > step ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 200);
  }

  function next() {
    if (step < STEP_COUNT) {
      persistStep(step);
      goToStep(step + 1);
    }
  }

  async function handlePresetContinue() {
    await persistStep(3, { preset: selectedPreset });
    goToStep(4);
  }

  async function handleTestWebhook() {
    setTestState("loading");
    setTestResult(null);
    setTestError(null);
    setTestPhase(0);

    const t1 = setTimeout(() => setTestPhase(1), 600);
    const t2 = setTimeout(() => setTestPhase(2), 1200);

    try {
      const res = await fetch("/api/webhook/test", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        clearTimeout(t1);
        clearTimeout(t2);
        setTestState("error");
        setTestError(json.error || t("onboarding.test.errorDefault"));
        return;
      }

      await new Promise((r) => setTimeout(r, Math.max(0, 1800 - (json.data?.durationMs ?? 0))));
      setTestPhase(3);
      setTestResult(json.data);
      setTestState("success");
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      setTestState("error");
      setTestError(t("onboarding.test.errorNetwork"));
    }
  }

  async function handleFinish() {
    await persistStep(6);
    router.push("/dashboard");
  }

  async function handleSkipAll() {
    await persistStep(6);
    router.push("/dashboard");
  }

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
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center">
          {Array.from({ length: STEP_COUNT }, (_, i) => {
            const s = i + 1;
            const isCompleted = s < step;
            const isActive = s === step;
            return (
              <div key={s} className="flex items-center">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 sm:w-12 transition-colors duration-300",
                      isCompleted || isActive ? "bg-mint" : "bg-silk"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full transition-all duration-300 shrink-0",
                    isCompleted && "bg-mint",
                    isActive && "bg-white border-2 border-mint shadow-[0_0_8px_rgba(52,211,153,0.5)]",
                    !isCompleted && !isActive && "bg-white border-2 border-silk"
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Step counter */}
        <p className="mb-4 text-center font-mono text-[0.55rem] text-mist uppercase tracking-wider">
          {t("onboarding.stepCounter").replace("{step}", String(step)).replace("{total}", String(STEP_COUNT))}
        </p>

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
              <StepWelcome name={state?.merchantName ?? ""} onNext={(consent) => {
                persistStep(1, { consent });
                goToStep(2);
              }} />
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

// ═══════════════════════════════════════════════════════════
// STEP 1 — Welcome
// ═══════════════════════════════════════════════════════════

function StepWelcome({ name, onNext }: { name: string; onNext: (consent: boolean) => void }) {
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

// ═══════════════════════════════════════════════════════════
// STEP 2 — Connect Store
// ═══════════════════════════════════════════════════════════

function StepConnectStore({
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

// ═══════════════════════════════════════════════════════════
// STEP 3 — Configure Scoring
// ═══════════════════════════════════════════════════════════

function StepConfigureScoring({
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

// ═══════════════════════════════════════════════════════════
// STEP 4 — Test Webhook
// ═══════════════════════════════════════════════════════════

function StepTestWebhook({
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

// ═══════════════════════════════════════════════════════════
// STEP 5 — Dashboard Ready
// ═══════════════════════════════════════════════════════════

function StepDashboardReady({ onFinish }: { onFinish: () => void }) {
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
