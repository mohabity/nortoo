"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, Store, Mail, Lock, Plug, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/provider";

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim() || name.trim().length < 2) {
      setError(t("auth.register.errors.nameMinLength"));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError(t("auth.register.errors.invalidEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.register.errors.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.register.errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      // 1. Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, locale }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("auth.register.errors.registrationFailed"));
        return;
      }

      // 2. Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(t("auth.register.errors.signInAfterRegister"));
        return;
      }

      // 3. Redirect to dashboard
      router.push("/dashboard");
    } catch {
      setError(t("auth.register.errors.serverError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4">
      <div className="w-full max-w-sm">
        {/* Back to landing */}
        <div className="mb-6">
          <a
            href={`https://nortoo.ma?lang=${locale}`}
            className="inline-flex items-center gap-1.5 text-sm text-fog hover:text-slate transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("auth.register.backToHome")}
          </a>
        </div>

        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/nortoo-logo.png" alt="nortoo" className="mx-auto h-9 w-auto" />
          <p className="mt-3 text-sm text-fog">
            {t("auth.register.tagline")}
          </p>
        </div>

        {/* Register Card */}
        <Card>
          <CardHeader className="text-center pb-2">
            <h1 className="font-display text-lg font-semibold text-midnight">
              {t("auth.register.title")}
            </h1>
            <p className="text-sm text-fog">
              {t("auth.register.subtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate mb-1.5"
                >
                  {t("auth.register.shopName")}
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <input
                    id="name"
                    type="text"
                    placeholder={t("auth.register.shopNamePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="organization"
                    autoFocus
                    className="w-full rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate mb-1.5"
                >
                  {t("auth.register.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <input
                    id="email"
                    type="email"
                    placeholder={t("auth.register.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate mb-1.5"
                >
                  {t("auth.register.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <input
                    id="password"
                    type="password"
                    placeholder={t("auth.register.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-slate mb-1.5"
                >
                  {t("auth.register.confirmPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder={t("auth.register.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-rose">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("auth.register.submit")}
              </Button>
            </form>

            {/* Separator */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-silk" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-mist">{t("auth.register.or")}</span>
              </div>
            </div>

            {/* YouCan OAuth */}
            <a
              href="/api/auth/youcan?mode=register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#5C6AC4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4F5BB5]"
            >
              <Plug className="h-4 w-4" />
              {t("auth.register.withYoucan")}
            </a>

            <p className="mt-4 text-center text-sm text-fog">
              {t("auth.register.hasAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-mint-deep hover:underline"
              >
                {t("auth.register.signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-mist">
          {t("auth.register.footer")}
        </p>
      </div>
    </div>
  );
}
