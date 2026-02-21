"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Entrez une adresse email valide");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.status === 429) {
        setError("Trop de demandes. Réessayez dans quelques minutes.");
        return;
      }

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Une erreur est survenue");
        return;
      }

      setSent(true);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-mint">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#0B0F1A" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 18V6l12 12V6"/>
              </svg>
            </div>
            <span className="font-display text-2xl font-black tracking-[-0.06em] text-midnight">
              nortoo
            </span>
          </div>
          <p className="mt-2 text-sm text-fog">
            Anti-Fraude RTO Intelligence
          </p>
        </div>

        <Card className="border-0 shadow-none sm:border sm:border-silk sm:shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <CardHeader className="text-center pb-2">
            <h1 className="font-display text-lg font-semibold text-midnight">
              Mot de passe oublié
            </h1>
            {!sent && (
              <p className="text-sm text-fog">
                Entrez votre email et nous vous enverrons un lien de réinitialisation.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="h-10 w-10 text-mint" />
                  <p className="text-sm text-slate text-center leading-relaxed">
                    Si un compte existe avec cet email, vous recevrez un lien de réinitialisation. Vérifiez vos spams.
                  </p>
                </div>

                <p className="text-xs text-mist text-center">
                  Pas reçu ? Vérifiez vos spams, ou essayez avec une autre adresse email.
                </p>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-mint-deep hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate mb-1.5"
                  >
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      className="w-full min-h-[48px] rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-rose">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full min-h-[48px]"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Envoyer le lien →
                </Button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-mint-deep hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Retour à la connexion
                </Link>
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
