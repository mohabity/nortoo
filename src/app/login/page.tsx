"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import Link from "next/link";
import { Zap, Loader2, Mail, Lock, Plug } from "lucide-react";
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
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-ink-2 mb-1.5"
                >
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
                  <input
                    id="email"
                    type="email"
                    placeholder="vous@votreboutique.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    className="w-full rounded-sm border border-border bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-sun/30 focus:border-sun"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink-2 mb-1.5"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-sm border border-border bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-sun/30 focus:border-sun"
                  />
                </div>
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

            {/* Separator */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-ink-4">ou</span>
              </div>
            </div>

            {/* YouCan OAuth */}
            <a
              href="/api/auth/youcan?mode=login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#5C6AC4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4F5BB5]"
            >
              <Plug className="h-4 w-4" />
              Se connecter avec YouCan
            </a>

            <p className="mt-4 text-center text-sm text-ink-3">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-medium text-sun-deep hover:underline"
              >
                Créer un compte
              </Link>
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
