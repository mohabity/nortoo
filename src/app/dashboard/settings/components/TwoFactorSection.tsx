"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, CheckCircle2, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/provider";

interface TwoFactorStatus {
  enabled: boolean;
  method: "totp" | "email" | null;
  verifiedAt: string | null;
  role: string;
  canEnable: boolean;
}

type SetupPhase = "idle" | "method-choice" | "loading" | "qr" | "verify" | "done";

export function TwoFactorSection({
  onToast,
}: {
  onToast: (type: "success" | "error" | "info", message: string) => void;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<SetupPhase>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [enablingEmail, setEnablingEmail] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/auth/2fa/status");
      const json = await res.json();
      setStatus(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupTotp() {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        setPhase("method-choice");
        return;
      }
      setQrDataUrl(json.data.qrDataUrl);
      setBackupCodes(json.data.backupCodes);
      setPhase("qr");
    } catch {
      setError("Erreur réseau");
      setPhase("method-choice");
    }
  }

  async function handleEnableEmail() {
    setEnablingEmail(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/enable-email", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        setEnablingEmail(false);
        return;
      }
      setPhase("done");
      onToast("success", t("settings.twoFactor.enabledSuccess"));
      await fetchStatus();
    } catch {
      setError("Erreur réseau");
    } finally {
      setEnablingEmail(false);
    }
  }

  async function handleVerify() {
    if (code.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        setVerifying(false);
        return;
      }
      setPhase("done");
      onToast("success", t("settings.twoFactor.enabledSuccess"));
      await fetchStatus();
    } catch {
      setError("Erreur réseau");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable() {
    // For email method, no code needed — just confirm
    if (status?.method === "totp" && disableCode.length !== 6) return;

    setDisabling(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status?.method === "totp" ? { code: disableCode } : {}),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        setDisabling(false);
        return;
      }
      setShowDisable(false);
      setDisableCode("");
      setPhase("idle");
      onToast("success", t("settings.twoFactor.disabledSuccess"));
      await fetchStatus();
    } catch {
      setError("Erreur réseau");
    } finally {
      setDisabling(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-mist" />
        </CardContent>
      </Card>
    );
  }

  if (!status?.canEnable) {
    return null; // Only show for admin/manager
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-violet" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {t("settings.twoFactor.title")}
              </CardTitle>
              {status.enabled && (
                <Badge variant="mint" className="text-[10px]">
                  {t("settings.twoFactor.active")}
                </Badge>
              )}
            </div>
            <CardDescription>
              {t("settings.twoFactor.subtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── 2FA Already Enabled ── */}
        {status.enabled && !showDisable && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-sm border border-mint bg-mint-bg/20 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-mint-deep" />
              <div className="flex-1">
                <span className="text-sm font-medium text-mint-deep">
                  {t("settings.twoFactor.enabled")}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-mint-deep/70">
                    {t("settings.twoFactor.currentMethod")} :
                  </span>
                  <span className="text-xs font-medium text-mint-deep">
                    {status.method === "email"
                      ? t("settings.twoFactor.methodLabelEmail")
                      : t("settings.twoFactor.methodLabelTotp")}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDisable(true);
                setError(null);
              }}
              className="text-rose hover:text-rose"
            >
              <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
              {t("settings.twoFactor.disable")}
            </Button>
          </div>
        )}

        {/* ── Disable Flow (TOTP — requires code) ── */}
        {status.enabled && showDisable && status.method === "totp" && (
          <div className="space-y-3">
            <p className="text-sm text-fog">
              {t("settings.twoFactor.disablePrompt")}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-32 rounded-sm border border-silk px-3 py-2 text-center font-mono text-lg tracking-widest focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
              />
              <Button
                onClick={handleDisable}
                disabled={disableCode.length !== 6 || disabling}
                variant="destructive"
                size="sm"
              >
                {disabling && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t("settings.twoFactor.confirmDisable")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDisable(false);
                  setDisableCode("");
                  setError(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
          </div>
        )}

        {/* ── Disable Flow (Email — no code, just confirm) ── */}
        {status.enabled && showDisable && status.method === "email" && (
          <div className="space-y-3">
            <p className="text-sm text-fog">
              {t("settings.twoFactor.disableEmailConfirm")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDisable}
                disabled={disabling}
                variant="destructive"
                size="sm"
              >
                {disabling && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t("settings.twoFactor.confirmDisable")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDisable(false);
                  setError(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
          </div>
        )}

        {/* ── Setup Flow: Idle → show method choice button ── */}
        {!status.enabled && phase === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-fog">
              {t("settings.twoFactor.description")}
            </p>
            <Button
              onClick={() => {
                setPhase("method-choice");
                setError(null);
              }}
              className="bg-mint hover:bg-mint-deep text-midnight"
            >
              <Shield className="mr-1.5 h-4 w-4" />
              {t("settings.twoFactor.enable")}
            </Button>
            {error && <p className="text-sm text-rose">{error}</p>}
          </div>
        )}

        {/* ── Setup Flow: Method Choice ── */}
        {!status.enabled && phase === "method-choice" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-midnight">
              {t("settings.twoFactor.methodChoice")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* TOTP option */}
              <button
                onClick={handleSetupTotp}
                className="flex flex-col items-start gap-2 rounded-sm border border-silk bg-white p-4 text-left transition-colors hover:border-mint hover:bg-mint-bg/10"
              >
                <Smartphone className="h-5 w-5 text-violet" />
                <span className="text-sm font-medium text-midnight">
                  {t("settings.twoFactor.methodTotp")}
                </span>
                <span className="text-xs text-fog leading-relaxed">
                  {t("settings.twoFactor.methodTotpDesc")}
                </span>
              </button>

              {/* Email option */}
              <button
                onClick={handleEnableEmail}
                disabled={enablingEmail}
                className="flex flex-col items-start gap-2 rounded-sm border border-silk bg-white p-4 text-left transition-colors hover:border-mint hover:bg-mint-bg/10 disabled:opacity-50"
              >
                {enablingEmail ? (
                  <Loader2 className="h-5 w-5 animate-spin text-ocean" />
                ) : (
                  <Mail className="h-5 w-5 text-ocean" />
                )}
                <span className="text-sm font-medium text-midnight">
                  {t("settings.twoFactor.methodEmail")}
                </span>
                <span className="text-xs text-fog leading-relaxed">
                  {t("settings.twoFactor.methodEmailDesc")}
                </span>
              </button>
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
          </div>
        )}

        {/* ── Setup Flow: Loading ── */}
        {phase === "loading" && (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-mist" />
            <span className="text-sm text-fog">{t("settings.twoFactor.generating")}</span>
          </div>
        )}

        {/* ── Setup Flow: QR Code + Backup Codes ── */}
        {phase === "qr" && qrDataUrl && (
          <div className="space-y-4">
            <p className="text-sm text-fog">
              {t("settings.twoFactor.scanQr")}
            </p>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="rounded-lg border border-silk bg-white p-3">
                <img src={qrDataUrl} alt="QR Code 2FA" className="h-48 w-48" />
              </div>
            </div>

            {/* Backup Codes */}
            <div className="rounded-sm border border-silk bg-snow p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-midnight">
                  {t("settings.twoFactor.backupCodesTitle")}
                </p>
                <button
                  onClick={copyBackupCodes}
                  className="flex items-center gap-1 text-xs text-ocean hover:text-ocean/80"
                >
                  {copiedCodes ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedCodes ? t("common.copied") : t("common.copy")}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {backupCodes.map((bc) => (
                  <code
                    key={bc}
                    className="rounded-xs bg-white border border-silk px-2 py-1 text-center font-mono text-xs text-midnight"
                  >
                    {bc}
                  </code>
                ))}
              </div>
              <p className="text-[11px] text-mist">
                {t("settings.twoFactor.backupCodesWarning")}
              </p>
            </div>

            <Button
              onClick={() => setPhase("verify")}
              className="w-full bg-mint hover:bg-mint-deep text-midnight"
            >
              {t("settings.twoFactor.continueVerify")}
            </Button>
          </div>
        )}

        {/* ── Setup Flow: Verify Code ── */}
        {phase === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-fog">
              {t("settings.twoFactor.enterCode")}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                className="w-36 rounded-sm border border-silk px-3 py-2.5 text-center font-mono text-xl tracking-widest focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
              />
              <Button
                onClick={handleVerify}
                disabled={code.length !== 6 || verifying}
                className="bg-mint hover:bg-mint-deep text-midnight"
              >
                {verifying && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t("settings.twoFactor.verify")}
              </Button>
            </div>
            {error && <p className="text-sm text-rose">{error}</p>}
          </div>
        )}

        {/* ── Setup Flow: Done ── */}
        {phase === "done" && (
          <div className="flex items-center gap-2 rounded-sm border border-mint bg-mint-bg/20 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-mint-deep" />
            <span className="text-sm font-medium text-mint-deep">
              {t("settings.twoFactor.enabledSuccess")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
