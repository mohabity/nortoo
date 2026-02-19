"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Entrez une adresse email valide");
      return;
    }

    setLoading(true);

    // MVP: Set cookie directly via API route, then redirect
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        router.push(redirect);
      } else {
        setError("Erreur de connexion");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-sun">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="font-sora text-2xl font-bold text-ink-1">
              COD<span className="text-sun">Pilot</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-3">
            Anti-Fraude RTO Intelligence
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center pb-2">
            <h1 className="font-sora text-lg font-semibold text-ink-1">
              Connexion
            </h1>
            <p className="text-sm text-ink-3">
              Accédez à votre tableau de bord
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink-2 mb-1.5"
                >
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@votreboutique.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  className="w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-sun/30 focus:border-sun"
                />
              </div>

              {error && (
                <p className="text-sm text-coral">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Se connecter
              </Button>
            </form>

            <p className="mt-4 text-center text-[11px] text-ink-4">
              MVP — Phase 2 intégrera Auth.js avec OAuth YouCan
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-ink-4">
          Données hébergées en 🇪🇺 Frankfurt — Conforme Loi 09-08
        </p>
      </div>
    </div>
  );
}
