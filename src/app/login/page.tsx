"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import Link from "next/link";
import { Loader2, Mail, Lock, Plug, Shield, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/provider";

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
  const { t, locale } = useTranslation();

  const oauthError = searchParams.get("error") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [needsEmail2FA, setNeedsEmail2FA] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(oauthError);

  /** Send the email 2FA code */
  async function sendEmailCode() {
    setSendingCode(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || t("auth.login.errors.emailCodeSendFailed"));
        return;
      }
      setCodeSent(true);
    } catch {
      setError(t("auth.login.errors.emailCodeSendFailed"));
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError(t("auth.login.errors.invalidEmail"));
      return;
    }

    if (!password) {
      setError(t("auth.login.errors.emptyPassword"));
      return;
    }

    if (needs2FA && !totpCode) {
      setError(t("auth.login.errors.empty2fa"));
      return;
    }

    if (needsEmail2FA && !emailCode) {
      setError(t("auth.login.errors.emptyEmailCode"));
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        totpCode: needs2FA ? totpCode : needsEmail2FA ? emailCode : "",
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("2FA_EMAIL_REQUIRED")) {
          setNeedsEmail2FA(true);
          setError("");
          // Automatically send the code
          setSendingCode(true);
          try {
            const res = await fetch("/api/auth/2fa/send-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
              setCodeSent(true);
            }
          } catch {
            // Silently fail, user can resend
          } finally {
            setSendingCode(false);
          }
          return;
        }
        if (result.error.includes("2FA_REQUIRED")) {
          setNeeds2FA(true);
          setError("");
          return;
        }
        if (result.error.includes("2FA_INVALID")) {
          setError(t("auth.login.errors.invalid2fa"));
          setTotpCode("");
          setEmailCode("");
          return;
        }
        setError(t("auth.login.errors.invalidCredentials"));
        return;
      }

      router.push(redirect);
    } catch {
      setError(t("auth.login.errors.serverError"));
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
            {t("auth.login.backToHome")}
          </a>
        </div>

        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/nortoo-logo.png" alt="nortoo" className="mx-auto h-9 w-auto" />
          <p className="mt-3 text-sm text-fog">
            {t("auth.login.tagline")}
          </p>
        </div>

        {/* Login Card — borderless on mobile for full-viewport feel */}
        <Card className="border-0 shadow-none sm:border sm:border-silk sm:shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <CardHeader className="text-center pb-2">
            <h1 className="font-display text-lg font-semibold text-midnight">
              {t("auth.login.title")}
            </h1>
            <p className="text-sm text-fog">
              {t("auth.login.subtitle")}
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
                  {t("auth.login.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <input
                    id="email"
                    type="email"
                    placeholder={t("auth.login.emailPlaceholder")}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate"
                  >
                    {t("auth.login.password")}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[0.78rem] font-normal text-ocean hover:underline"
                  >
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                  <input
                    id="password"
                    type="password"
                    placeholder={t("auth.login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full min-h-[44px] rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                </div>
              </div>

              {/* 2FA Code (TOTP) */}
              {needs2FA && (
                <div>
                  <label
                    htmlFor="totp"
                    className="block text-sm font-medium text-slate mb-1.5"
                  >
                    {t("auth.login.twoFactorLabel")}
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <input
                      id="totp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={t("auth.login.twoFactorPlaceholder")}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                      autoComplete="one-time-code"
                      className="w-full min-h-[44px] rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm font-mono text-center tracking-widest placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                    />
                  </div>
                  <p className="mt-1 text-xs text-fog">
                    {t("auth.login.twoFactorHint")}
                  </p>
                </div>
              )}

              {/* 2FA Code (Email) */}
              {needsEmail2FA && (
                <div>
                  {codeSent && (
                    <div className="flex items-center gap-2 rounded-sm border border-mint bg-mint-bg/20 px-3 py-2 mb-3">
                      <Mail className="h-4 w-4 text-mint-deep shrink-0" />
                      <span className="text-xs text-mint-deep">
                        {t("auth.login.emailCodeSent")}
                      </span>
                    </div>
                  )}
                  <label
                    htmlFor="emailCode"
                    className="block text-sm font-medium text-slate mb-1.5"
                  >
                    {t("auth.login.emailCodeLabel")}
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <input
                      id="emailCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={t("auth.login.emailCodePlaceholder")}
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                      autoComplete="one-time-code"
                      className="w-full min-h-[44px] rounded-sm border border-silk bg-white pl-10 pr-3 py-2.5 text-sm font-mono text-center tracking-widest placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-fog">
                      {t("auth.login.emailCodeHint")}
                    </p>
                    <button
                      type="button"
                      onClick={sendEmailCode}
                      disabled={sendingCode}
                      className="inline-flex items-center gap-1 text-xs text-ocean hover:text-ocean/80 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${sendingCode ? "animate-spin" : ""}`} />
                      {sendingCode
                        ? t("auth.login.emailCodeSending")
                        : t("auth.login.emailCodeResend")}
                    </button>
                  </div>
                </div>
              )}

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
                {needs2FA ? t("auth.login.submitVerify") : t("auth.login.submitLogin")}
              </Button>
            </form>

            {/* Separator */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-silk" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-mist">{t("auth.login.or")}</span>
              </div>
            </div>

            {/* YouCan OAuth */}
            <a
              href="/api/auth/youcan?mode=login"
              className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-sm bg-[#5C6AC4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4F5BB5]"
            >
              <Plug className="h-4 w-4" />
              {t("auth.login.withYoucan")}
            </a>

            <p className="mt-4 text-center text-sm text-fog">
              {t("auth.login.noAccount")}{" "}
              <Link
                href="/register"
                className="font-medium text-mint-deep hover:underline"
              >
                {t("auth.login.register")}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 pb-4 text-center text-xs text-mist" style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}>
          {t("auth.login.footer")}
        </p>
      </div>
    </div>
  );
}
