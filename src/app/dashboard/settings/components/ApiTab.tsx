"use client";

import { useState } from "react";
import {
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Link2,
  Code2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import type { BaseTabProps } from "../types";

export function ApiTab({ settings, onRefresh, onToast }: BaseTabProps) {
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/ingest`
      : "/api/webhook/ingest";

  const maskedKey = settings.apiKey
    ? settings.apiKey.slice(0, 8) + "••••••••••••••••"
    : "—";

  const displayKey = showKey ? (settings.apiKey ?? "—") : maskedKey;

  // Copy helpers
  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  // Regenerate API key
  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/settings/api-key/regenerate", {
        method: "POST",
      });
      if (res.ok) {
        await onRefresh();
        onToast("success", t("settings.api.regenerated"));
        setShowKey(true);
      } else {
        onToast("error", t("settings.api.regenerateError"));
      }
    } catch {
      onToast("error", t("settings.api.regenerateError"));
    } finally {
      setRegenerating(false);
      setShowRegenerateModal(false);
    }
  }

  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-nortoo-key: ${settings.apiKey ?? "VOTRE_CLE_API"}" \\
  -d '{
    "ref": "#1234",
    "customer": {
      "phone": "0612345678",
      "name": "Ahmed Benali",
      "city": "Casablanca",
      "address": "123 Rue Mohamed V, Maârif"
    },
    "total": 349,
    "currency": "MAD",
    "product": "T-shirt Nike Dri-FIT",
    "shipping_city": "Casablanca",
    "shipping_address": "123 Rue Mohamed V, Maârif"
  }'`;

  const payloadExample = `{
  "ref": "#1234",
  "customer": {
    "phone": "0612345678",
    "name": "Ahmed Benali",
    "city": "Casablanca",
    "address": "123 Rue Mohamed V, Maârif"
  },
  "total": 349,
  "currency": "MAD",
  "product": "T-shirt Nike Dri-FIT",
  "shipping_city": "Casablanca",
  "shipping_address": "123 Rue Mohamed V, Maârif"
}`;

  return (
    <div className="space-y-6">
      {/* ═══ Clé API ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">{t("settings.api.apiKey")}</CardTitle>
              <CardDescription>
                {t("settings.api.apiKeySubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-mist mb-2">
              {t("settings.api.apiKeyInstruction")}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-sm border border-silk bg-snow px-3 py-2 font-mono text-sm text-slate overflow-x-auto">
                {displayKey}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? t("common.hide") : t("common.show")}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  settings.apiKey &&
                  copyText(settings.apiKey, setCopiedKey)
                }
                disabled={!settings.apiKey}
                title={t("common.copy")}
              >
                {copiedKey ? (
                  <Check className="h-4 w-4 text-mint-deep" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Regenerate button */}
          <Dialog.Root
            open={showRegenerateModal}
            onOpenChange={setShowRegenerateModal}
          >
            <Dialog.Trigger asChild>
              <Button variant="destructive" size="sm">
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                {t("settings.api.regenerate")}
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded bg-white p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-rose-bg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-rose" />
                  </div>
                  <Dialog.Title className="font-display font-semibold text-midnight text-lg">
                    {t("settings.api.regenerateTitle")}
                  </Dialog.Title>
                </div>
                <Dialog.Description className="text-sm text-fog mb-6">
                  {t("settings.api.regenerateWarning")}
                </Dialog.Description>
                <div className="flex justify-end gap-3">
                  <Dialog.Close asChild>
                    <Button variant="outline">{t("common.cancel")}</Button>
                  </Dialog.Close>
                  <Button
                    variant="destructive"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    {regenerating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("settings.api.regenerate")}
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </CardContent>
      </Card>

      {/* ═══ URL du webhook ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-ocean" />
            <div>
              <CardTitle className="text-base">{t("settings.api.webhookUrl")}</CardTitle>
              <CardDescription>
                {t("settings.api.webhookUrlSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-sm border border-silk bg-snow px-3 py-2 font-mono text-sm text-slate select-all overflow-x-auto">
              {webhookUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyText(webhookUrl, setCopiedUrl)}
              title={t("common.copy")}
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 text-mint-deep" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Exemples d'intégration ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-violet" />
            <div>
              <CardTitle className="text-base">
                {t("settings.api.examples")}
              </CardTitle>
              <CardDescription>
                {t("settings.api.examplesSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* cURL example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate">{t("settings.api.curlExample")}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyText(curlExample, setCopiedCurl)}
              >
                {copiedCurl ? (
                  <Check className="mr-1.5 h-3.5 w-3.5 text-mint-deep" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copiedCurl ? t("common.copied") : t("common.copy")}
              </Button>
            </div>
            <pre className="bg-midnight text-green-400 font-mono text-xs rounded-sm p-4 overflow-x-auto whitespace-pre">
              {curlExample}
            </pre>
          </div>

          {/* JSON payload example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate">{t("settings.api.jsonPayload")}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyText(payloadExample, setCopiedPayload)}
              >
                {copiedPayload ? (
                  <Check className="mr-1.5 h-3.5 w-3.5 text-mint-deep" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copiedPayload ? t("common.copied") : t("common.copy")}
              </Button>
            </div>
            <pre className="bg-midnight text-mint font-mono text-xs rounded-sm p-4 overflow-x-auto whitespace-pre">
              {payloadExample}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
