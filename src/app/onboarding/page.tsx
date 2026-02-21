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

// ── Preset data ──

const PRESETS: {
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
    label: "Permissif",
    description:
      "Laisser passer un maximum de commandes. Idéal si vous avez peu de retours.",
    thresholds: "Expédier < 45 · Bloquer > 95",
  },
  {
    key: "balanced",
    emoji: "🟡",
    label: "Équilibré",
    recommended: true,
    description:
      "Bon compromis entre ventes et protection. Idéal pour la plupart des boutiques.",
    thresholds: "Expédier < 31 · Bloquer > 86",
  },
  {
    key: "conservative",
    emoji: "🔴",
    label: "Strict",
    description:
      "Filtrer agressivement les commandes. Idéal si vous avez un taux de retour élevé.",
    thresholds: "Expédier < 25 · Bloquer > 75",
  },
];

const STEP_COUNT = 5;

const DECISION_LABELS: Record<string, string> = {
  ship: "Expédier",
  verify: "Vérifier",
  flag: "Signaler",
  block: "Bloquer",
};

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
        setTestError(json.error || "Erreur lors du test");
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
      setTestError("Erreur réseau. Vérifiez votre connexion.");
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
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gradient-to-br from-mint to-mint-deep shadow-md">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0B0F1A"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M6 18V6l12 12V6" />
          </svg>
        </div>
        <span className="font-display text-xl font-black tracking-[-0.06em] text-midnight">
          nortoo
        </span>
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
          Étape {step}/{STEP_COUNT}
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
              <StepWelcome name={state?.merchantName ?? ""} onNext={next} />
            )}
            {step === 2 && (
              <StepConnectStore
                storeConnected={state?.storeConnected ?? false}
                onNext={next}
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
            {"Passer la configuration →"}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-mist">
          {"Données hébergées en 🇪🇺 Frankfurt — Conforme Loi 09-08"}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 1 — Welcome
// ═══════════════════════════════════════════════════════════

function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="text-center space-y-5">
      <div className="text-5xl">{"🎯"}</div>
      <div>
        <h2 className="font-display text-xl sm:text-[1.4rem] font-bold text-midnight">
          Bienvenue sur nortoo{name ? `, ${name}` : ""} !
        </h2>
        <p className="mt-2 text-sm text-fog">
          Scorez vos commandes COD en temps réel et réduisez vos retours de 40%.
        </p>
      </div>

      {/* Mini features */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { emoji: "🔍", label: "Score instantané" },
          { emoji: "📊", label: "Dashboard live" },
          { emoji: "🛡️", label: "Anti-fraude auto" },
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

      <div>
        <Button
          onClick={onNext}
          className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
        >
          C&apos;est parti <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="mt-2 font-mono text-[0.55rem] text-mist">
          Configuration en ~3 minutes
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
}: {
  storeConnected: boolean;
  onNext: () => void;
}) {
  const [autoAdvance, setAutoAdvance] = useState(false);

  useEffect(() => {
    if (storeConnected && !autoAdvance) {
      setAutoAdvance(true);
      const t = setTimeout(onNext, 1500);
      return () => clearTimeout(t);
    }
  }, [storeConnected, autoAdvance, onNext]);

  if (storeConnected) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="h-12 w-12 text-mint-deep mx-auto" />
        <h2 className="font-display text-lg font-bold text-mint-deep">
          Boutique connectée !
        </h2>
        <p className="text-sm text-fog">Redirection en cours...</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-5">
      <div className="text-5xl">{"🏪"}</div>
      <div>
        <h2 className="font-display text-xl font-bold text-midnight">
          Connectez votre boutique YouCan
        </h2>
        <p className="mt-2 text-sm text-fog">
          nortoo s&apos;installe automatiquement. Vos commandes COD seront scorées en temps réel.
        </p>
      </div>

      <div>
        <a href="/api/auth/youcan">
          <Button className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5">
            Connecter YouCan <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-fog">
          Pas de boutique YouCan ?{" "}
          <button onClick={onNext} className="text-ocean hover:underline">
            {"Intégration manuelle via API →"}
          </button>
        </p>
        <p className="font-mono text-[0.55rem] text-mist">
          {"🔒 Connexion sécurisée OAuth — nortoo ne stocke pas vos identifiants YouCan"}
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
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">{"⚙️"}</div>
        <h2 className="font-display text-xl font-bold text-midnight">
          Choisissez votre niveau de filtrage
        </h2>
        <p className="mt-2 text-sm text-fog">
          Comment voulez-vous traiter les commandes à risque ?
        </p>
      </div>

      <div className="space-y-3">
        {PRESETS.map((p) => {
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
                        recommandé
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
          Continuer <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button onClick={onSkip} className="text-xs text-mist hover:text-fog block mx-auto">
          {"Garder les réglages par défaut →"}
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
  const phases = [
    "Commande envoyée",
    testResult ? `Score calculé : ${testResult.score}/100` : "Score en cours...",
    testResult
      ? `Décision : ${DECISION_LABELS[testResult.decision] || testResult.decision}`
      : "Décision en cours...",
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">{"🧪"}</div>
        <h2 className="font-display text-xl font-bold text-midnight">
          Testez la connexion
        </h2>
        <p className="mt-2 text-sm text-fog">
          On envoie une fausse commande pour vérifier que tout fonctionne.
        </p>
      </div>

      {/* Idle */}
      {testState === "idle" && (
        <div className="text-center">
          <Button
            onClick={onTest}
            className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
          >
            {"Envoyer une commande test 🚀"}
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
                Test réussi en {testResult.durationMs}ms
              </span>
            </div>

            <div className="rounded-lg border border-silk bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-fog">
                  Commande test {testResult.testOrder.ref}
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
                  {"✅"} {DECISION_LABELS[testResult.decision] || testResult.decision}
                </span>
              </div>
              <p className="text-xs text-fog">
                Client: {testResult.testOrder.customer} ·{" "}
                {testResult.testOrder.city}
              </p>
              <p className="text-xs text-fog">
                Montant: {testResult.testOrder.total} DH
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={onNext}
              className="w-full max-w-[320px] bg-mint hover:bg-mint-deep text-midnight font-semibold py-5"
            >
              Continuer <ArrowRight className="ml-2 h-4 w-4" />
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
                La connexion a échoué
              </span>
            </div>
            <p className="text-xs text-fog">{testError}</p>
          </div>
          <div className="text-center">
            <Button onClick={onTest} variant="outline" className="w-full max-w-[320px]">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Skip */}
      {(testState === "idle" || testState === "error") && (
        <div className="text-center">
          <button onClick={onSkip} className="text-xs text-mist hover:text-fog">
            {"Passer cette étape →"}
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
  return (
    <div className="text-center space-y-5">
      <div className="text-5xl">{"🎉"}</div>
      <div>
        <h2 className="font-display text-xl font-bold text-midnight">
          Votre dashboard est prêt !
        </h2>
        <p className="mt-2 text-sm text-fog">
          La prochaine commande COD de votre boutique sera scorée automatiquement.
        </p>
      </div>

      {/* Tips */}
      <div className="text-left space-y-3 rounded-lg bg-snow border border-silk p-4">
        {[
          "Chaque commande est scorée de 0 (safe) à 100 (risque maximum)",
          "Les commandes à risque sont signalées avec une notification",
          "Vous pouvez override n'importe quelle décision manuellement",
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
          Voir mon dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <a
          href="/dashboard/settings"
          className="inline-block text-xs text-mist hover:text-fog"
        >
          Personnaliser mes réglages
        </a>
      </div>
    </div>
  );
}
