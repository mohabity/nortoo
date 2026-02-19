"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Loader2,
  Plug,
  ShieldCheck,
  Rocket,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

// ── Steps data ──
const steps = [
  {
    number: 1,
    label: "Connecter",
    description: "Liez votre boutique YouCan",
    icon: Plug,
  },
  {
    number: 2,
    label: "Autoriser",
    description: "Acceptez les permissions",
    icon: ShieldCheck,
  },
  {
    number: 3,
    label: "C'est prêt",
    description: "Les commandes sont scorées",
    icon: Rocket,
  },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const connected = searchParams.get("connected");

  const [redirecting, setRedirecting] = useState(false);

  // Auto-redirect to dashboard after success
  useEffect(() => {
    if (connected === "true") {
      setRedirecting(true);
      const timer = setTimeout(() => {
        router.push("/dashboard?connected=true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [connected, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-lg">
        {/* ── Logo ── */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gradient-to-br from-sun to-sun-deep shadow-md">
              <span className="font-sora text-xl font-extrabold text-white">C</span>
            </div>
            <div>
              <span className="font-sora text-2xl font-bold text-ink-1">
                COD<span className="text-sun">Pilot</span>
              </span>
              <p className="text-left text-[11px] font-medium text-ink-4">
                Anti-Fraude RTO Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Card ── */}
        <Card className="p-8">
          {/* Title */}
          <h1 className="text-center font-sora text-xl font-semibold text-ink-1">
            Connectez votre boutique
          </h1>
          <p className="mt-2 text-center text-sm text-ink-3">
            En 30 secondes, CODPilot score automatiquement vos commandes COD
          </p>

          {/* ── 3 Steps ── */}
          <div className="mt-8 flex items-start justify-between gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = connected === "true" ? true : idx === 0;
              const isDone = connected === "true";

              return (
                <div key={step.number} className="flex flex-1 flex-col items-center text-center">
                  {/* Step circle */}
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                      isDone
                        ? "bg-mint-light"
                        : isActive
                          ? "bg-sun-light"
                          : "bg-sand"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-7 w-7 text-mint-deep" />
                    ) : (
                      <Icon
                        className={`h-6 w-6 ${
                          isActive ? "text-sun-deep" : "text-ink-4"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step label */}
                  <p
                    className={`mt-3 text-sm font-semibold ${
                      isDone
                        ? "text-mint-deep"
                        : isActive
                          ? "text-ink-1"
                          : "text-ink-4"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-4 leading-tight">
                    {step.description}
                  </p>

                  {/* Connector line */}
                  {idx < steps.length - 1 && (
                    <div
                      className={`absolute hidden h-0.5 w-12 ${
                        isDone ? "bg-mint" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Connector lines between steps */}
          <div className="mx-auto mt-[-52px] mb-8 flex max-w-[280px] items-center justify-center px-10">
            <div className={`h-0.5 flex-1 ${connected === "true" ? "bg-mint" : "bg-border"}`} />
            <div className="w-16" />
            <div className={`h-0.5 flex-1 ${connected === "true" ? "bg-mint" : "bg-border"}`} />
          </div>

          {/* ── Error Alert ── */}
          {error && (
            <div className="mt-2 flex items-start gap-3 rounded-sm border border-coral/30 bg-coral-light p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral" />
              <div>
                <p className="text-sm font-medium text-terra">
                  Échec de la connexion
                </p>
                <p className="mt-1 text-sm text-ink-2">{error}</p>
              </div>
            </div>
          )}

          {/* ── Success Alert ── */}
          {connected === "true" && (
            <div className="mt-2 flex items-start gap-3 rounded-sm border border-mint/30 bg-mint-light p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-mint-deep" />
              <div>
                <p className="text-sm font-medium text-mint-deep">
                  Boutique connectée avec succès !
                </p>
                <p className="mt-1 text-sm text-ink-3">
                  Redirection vers le tableau de bord...
                </p>
              </div>
            </div>
          )}

          {/* ── CTA Button ── */}
          {connected !== "true" && (
            <div className="mt-8">
              <a href="/api/auth/youcan" className="block">
                <Button
                  className="w-full bg-sun hover:bg-sun-deep text-white font-semibold py-6 text-base rounded-sm shadow-md transition-all hover:shadow-lg"
                  size="lg"
                >
                  <Plug className="mr-2 h-5 w-5" />
                  Connecter ma boutique YouCan
                  <ExternalLink className="ml-2 h-4 w-4 opacity-60" />
                </Button>
              </a>

              <p className="mt-4 text-center text-[11px] text-ink-4 leading-relaxed">
                Vous serez redirigé vers YouCan pour autoriser l&apos;accès.
                <br />
                CODPilot ne stocke jamais vos mots de passe.
              </p>
            </div>
          )}

          {/* ── Redirecting spinner ── */}
          {redirecting && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-mint-deep">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirection en cours...
            </div>
          )}
        </Card>

        {/* ── Footer ── */}
        <div className="mt-6 text-center">
          <p className="text-xs text-ink-4">
            Données hébergées en 🇪🇺 Frankfurt — Conforme Loi 09-08
          </p>
          <p className="mt-1 text-[11px] text-ink-4">
            Vous avez déjà un compte ?{" "}
            <a href="/login" className="text-ocean underline">
              Connexion email
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
