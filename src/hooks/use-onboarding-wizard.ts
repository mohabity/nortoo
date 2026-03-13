"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n/provider";
import type { TestResult } from "@/app/onboarding/_components/step-test-webhook";
import type { PresetKey } from "@/app/onboarding/_components/step-configure-scoring";
import { STEP_COUNT } from "@/app/onboarding/_components/progress-dots";

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  merchantName: string;
  storeConnected: boolean;
  scoringConfigured: boolean;
  testOrderSent: boolean;
  realOrderCount: number;
}

export function useOnboardingWizard() {
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

  return {
    // State
    state,
    step,
    direction,
    animating,
    loading,

    // Scoring
    selectedPreset,
    setSelectedPreset,

    // Test
    testState,
    testResult,
    testError,
    testPhase,

    // Actions
    persistStep,
    goToStep,
    next,
    handlePresetContinue,
    handleTestWebhook,
    handleFinish,
    handleSkipAll,
  };
}
