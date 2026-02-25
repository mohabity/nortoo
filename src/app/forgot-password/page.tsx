"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/provider";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError(t("auth.forgotPassword.errors.invalidEmail"));
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
        setError(t("auth.forgotPassword.errors.tooMany"));
        return;
      }

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || t("auth.forgotPassword.errors.generic"));
        return;
      }

      setSent(true);
    } catch {
      setError(t("auth.forgotPassword.errors.network"));
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
            {t("auth.forgotPassword.tagline")}
          </p>
        </div>

        <Card className="border-0 shadow-none sm:border sm:border-silk sm:shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <CardHeader className="text-center pb-2">
            <h1 className="font-display text-lg font-semibold text-midnight">
              {t("auth.forgotPassword.title")}
            </h1>
            {!sent && (
              <p className="text-sm text-fog">
                {t("auth.forgotPassword.subtitle")}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="h-10 w-10 text-mint" />
                  <p className="text-sm text-slate text-center leading-relaxed">
                    {t("auth.forgotPassword.sent")}
                  </p>
                </div>

                <p className="text-xs text-mist text-center">
                  {t("auth.forgotPassword.notReceived")}
                </p>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-mint-deep hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("auth.forgotPassword.backToLogin")}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate mb-1.5"
                  >
                    {t("auth.forgotPassword.emailLabel")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <input
                      id="email"
                      type="email"
                      placeholder={t("auth.forgotPassword.emailPlaceholder")}
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
                  {t("auth.forgotPassword.submit")}
                </Button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-sm font-medium text-mint-deep hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("auth.forgotPassword.backToLogin")}
                </Link>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 pb-4 text-center text-xs text-mist" style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}>
          {t("auth.forgotPassword.hostedInEU")}
        </p>
      </div>
    </div>
  );
}
