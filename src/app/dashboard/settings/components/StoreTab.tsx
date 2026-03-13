"use client";

import { useState, useEffect } from "react";
import {
  Webhook,
  Copy,
  Check,
  ShoppingBag,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { BaseTabProps } from "../types";

import { StoreInfo } from "./store-info";
import { TestWebhookPanel } from "./test-webhook-panel";
import { WebhookDiagnostics, type Diagnostics } from "./webhook-diagnostics";

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

// ── Component ──

export function StoreTab({ settings, onToast }: BaseTabProps) {
  const { t } = useTranslation();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [diagLoading, setDiagLoading] = useState(true);

  const isConnected = !!settings.youcanStoreId;

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/ingest`
      : "/api/webhook/ingest";

  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        const res = await fetch("/api/settings/diagnostics");
        if (res.ok) {
          const json = await res.json();
          setDiagnostics(json.data);
        }
      } catch {
        // silently fail
      } finally {
        setDiagLoading(false);
      }
    }
    fetchDiagnostics();
  }, []);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* ═══ YouCan Connection ═══ */}
      <StoreInfo
        isConnected={isConnected}
        name={settings.name}
        youcanStoreId={settings.youcanStoreId}
        domain={settings.domain}
        consentRecordedAt={settings.consentRecordedAt}
        onToast={onToast}
      />

      {/* ═══ Webhook URL ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-ocean" />
              <div>
                <CardTitle className="text-base">{t("settings.store.webhook")}</CardTitle>
                <CardDescription>
                  {t("settings.store.webhookSubtitle")}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "mint" : "default"}>
              {isConnected ? t("common.active") : t("common.inactive")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              {t("settings.store.webhookUrl")}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-sm border border-silk bg-snow px-3 py-2 font-mono text-sm text-slate select-all overflow-x-auto">
                {webhookUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyText(webhookUrl)}
                title={t("common.copy")}
              >
                {copiedUrl ? (
                  <Check className="h-4 w-4 text-mint-deep" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {isConnected && (
            <div className="rounded-xs bg-snow px-3 py-2">
              <p className="text-xs text-fog">
                <span className="font-medium text-mint-deep">{t("settings.store.lastWebhook")}</span>{" "}
                {diagLoading
                  ? t("common.loading")
                  : diagnostics?.lastRealWebhookAt
                    ? timeAgo(diagnostics.lastRealWebhookAt)
                    : t("settings.store.noneReceived")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Test Webhook ═══ */}
      {isConnected && <TestWebhookPanel />}

      {/* ═══ Diagnostics ═══ */}
      {isConnected && (
        <WebhookDiagnostics
          diagnostics={diagnostics}
          diagLoading={diagLoading}
        />
      )}

      {/* ═══ Other Platforms ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-mist" />
            <div>
              <CardTitle className="text-base">{t("settings.store.otherPlatforms")}</CardTitle>
              <CardDescription>
                {t("settings.store.comingSoon")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className={cn(
              "flex items-center justify-between rounded-sm border border-silk p-4",
              "opacity-60"
            )}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xs bg-snow flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-mist" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate">{t("settings.store.shopify")}</p>
                  <p className="text-xs text-mist">{t("settings.store.shopifyDesc")}</p>
                </div>
              </div>
              <Badge>{t("common.soon")}</Badge>
            </div>
            <div className={cn(
              "flex items-center justify-between rounded-sm border border-silk p-4",
              "opacity-60"
            )}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xs bg-snow flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-mist" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate">{t("settings.store.woocommerce")}</p>
                  <p className="text-xs text-mist">{t("settings.store.woocommerceDesc")}</p>
                </div>
              </div>
              <Badge>{t("common.soon")}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
