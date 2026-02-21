"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, CheckCircle2, XCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-snow">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"invalid" | "expired" | "generic" | "">("");
  const [success, setSuccess] = useState(false);

  const isLongEnough = password.length >= 8;
  const doMatch = password.length > 0 && password === passwordConfirm;
  const canSubmit = isLongEnough && doMatch && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorType("");

    if (!token) {
      setError("Lien invalide — aucun token trouvé.");
      setErrorType("invalid");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, passwordConfirm }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.error || "Une erreur est survenue";
        setError(msg);

        if (msg.includes("invalide") || msg.includes("utilisé")) {
          setErrorType("invalid");
        } else if (msg.includes("expiré")) {
          setErrorType("expired");
        } else {
          setErrorType("generic");
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erreur de connexion au serveur");
      setErrorType("generic");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/nortoo-logo.png" alt="nortoo" className="mx-auto h-9 w-auto" />
          <p className="mt-3 text-sm text-fog">
            Anti-Fraude RTO Intelligence
          </p>
        </div>

        <Card className="border-0 shadow-none sm:border sm:border-silk sm:shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <CardHeader className="text-center pb-2">
            <h1 className="font-display text-lg font-semibold text-midnight">
              {success ? "Mot de passe réinitialisé" : "Nouveau mot de passe"}
            </h1>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="h-10 w-10 text-mint" />
                  <p className="text-sm text-slate text-center">
                    Mot de passe réinitialisé avec succès !
                  </p>
                </div>
                <Link href="/login">
                  <Button className="w-full min-h-[48px]">
                    Se connecter →
                  </Button>
                </Link>
              </div>
            ) : error && (errorType === "invalid" || errorType === "expired") ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <XCircle className="h-10 w-10 text-rose" />
                  <p className="text-sm text-slate text-center">{error}</p>
                </div>
                <Link href="/forgot-password">
                  <Button className="w-full min-h-[48px]">
                    Demander un nouveau lien →
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate mb-1.5"
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
                      className="w-full min-h-[48px] rounded-sm border border-silk bg-white pl-10 pr-10 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                    />
                    {password.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isLongEnough ? (
                          <Check className="h-4 w-4 text-mint" />
                        ) : (
                          <X className="h-4 w-4 text-rose" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="passwordConfirm"
                    className="block text-sm font-medium text-slate mb-1.5"
                  >
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <input
                      id="passwordConfirm"
                      type="password"
                      placeholder="Confirmez votre mot de passe"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      autoComplete="new-password"
                      className="w-full min-h-[48px] rounded-sm border border-silk bg-white pl-10 pr-10 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                    />
                    {passwordConfirm.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {doMatch ? (
                          <Check className="h-4 w-4 text-mint" />
                        ) : (
                          <X className="h-4 w-4 text-rose" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Validation hints */}
                <div className="space-y-1">
                  <p className={`text-xs flex items-center gap-1.5 ${isLongEnough ? "text-mint-deep" : "text-mist"}`}>
                    {isLongEnough ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Au moins 8 caractères
                  </p>
                  <p className={`text-xs flex items-center gap-1.5 ${doMatch ? "text-mint-deep" : "text-mist"}`}>
                    {doMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    Les mots de passe correspondent
                  </p>
                </div>

                {error && errorType === "generic" && (
                  <p className="text-sm text-rose">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full min-h-[48px]"
                  disabled={!canSubmit}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Réinitialiser →
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 pb-4 text-center text-xs text-mist" style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}>
          Données hébergées en 🇪🇺 Frankfurt — Conforme Loi 09-08
        </p>
      </div>
    </div>
  );
}
