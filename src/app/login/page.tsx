"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import Link from "next/link";
import { Loader2, Mail, Lock, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-snow">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
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

  const oauthError = searchParams.get("error") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(oauthError);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Entrez une adresse email valide");
      return;
    }

    if (!password) {
      setError("Entrez votre mot de passe");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        return;
      }

      router.push(redirect);
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
                <path d="M3 6h18M7 12h10M10 18h4"/>
              </svg>
            </div>
            <span className="font-display text-2xl font-black tracking-[-0.06em] text-midnight">
              Siift
            </span>
          </div>
          <p className="mt-2 text-sm text-fog">
            Anti-Fraude RTO Intelligence
          </p>
        </div>

        {/* Login Card — borderless on mobile for full-viewport feel */}
        <Card className="border-0 shadow-none sm:border sm:border-silk sm:shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <CardHeader className="text-center pb-2">
            <h1 className="font-display text-lg font-semibold text-midnight">
              Connexion
            </h1>
            <p className="text-sm text-fog">
              Accédez à votre tableau de bord
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
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
                    placeholder="vous@votreboutique.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    className="w-full min-h-[44px] rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate mb-1.5"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full min-h-[44px] rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
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
                Se connecter
              </Button>
            </form>

            {/* Separator */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-silk" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-mist">ou</span>
              </div>
            </div>

            {/* YouCan OAuth */}
            <a
              href="/api/auth/youcan?mode=login"
              className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-sm bg-[#5C6AC4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4F5BB5]"
            >
              <Plug className="h-4 w-4" />
              Se connecter avec YouCan
            </a>

            <p className="mt-4 text-center text-sm text-fog">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-medium text-mint-deep hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 pb-4 text-center text-xs text-mist" style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}>
          Données hébergées en 🇪🇺 Frankfurt — Conforme Loi 09-08
        </p>
      </div>
    </div>
  );
}
