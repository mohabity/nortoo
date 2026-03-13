"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

// ── Types ──

export interface Diagnostics {
  storeConnected: boolean;
  storeName: string;
  storeId: string | null;
  hasApiKey: boolean;
  webhookUrl: string;
  lastRealWebhookAt: string | null;
  lastTestWebhookAt: string | null;
  totalWebhooksReceived: number;
  totalWebhooksLast24h: number;
  tokenStatus: string;
  queueStatus: { pending: number; failed: number; dead: number };
}

type PingStatus = "idle" | "loading" | "ok" | "expired" | "unreachable" | "no_token";

interface WebhookDiagnosticsProps {
  diagnostics: Diagnostics | null;
  diagLoading: boolean;
}

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

function webhookFreshness(dateStr: string | null): "ok" | "warning" | "critical" | "none" {
  if (!dateStr) return "none";
  const hoursAgo = (Date.now() - new Date(dateStr).getTime()) / 3_600_000;
  if (hoursAgo > 72) return "critical";
  if (hoursAgo > 24) return "warning";
  return "ok";
}

// ── Component ──

export function WebhookDiagnostics({
  diagnostics,
  diagLoading,
}: WebhookDiagnosticsProps) {
  const { t } = useTranslation();

  // Ping state
  const [pingStatus, setPingStatus] = useState<PingStatus>("idle");
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  async function handlePing() {
    setPingStatus("loading");
    setPingLatency(null);

    try {
      const res = await fetch("/api/webhook/ping", { method: "POST" });
      const json = await res.json();
      const d = json.data;
      setPingStatus(d.status as PingStatus);
      setPingLatency(d.latencyMs ?? null);
    } catch {
      setPingStatus("unreachable");
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-ocean" />
          <div>
            <CardTitle className="text-base">{t("settings.store.diagnostics")}</CardTitle>
            <CardDescription>
              {t("settings.store.diagnosticsSubtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {diagLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-mist" />
            <span className="text-sm text-fog">{t("settings.store.loadingDiagnostics")}</span>
          </div>
        ) : diagnostics ? (
          <div className="rounded-sm border border-silk divide-y divide-silk">
            {/* Store connected */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {diagnostics.storeConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-mint-deep" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose" />
                )}
                <span className="text-sm text-slate">{t("settings.store.storeConnected")}</span>
              </div>
              <span className="text-sm text-fog">
                {diagnostics.storeConnected ? diagnostics.storeName : t("common.no")}
              </span>
            </div>

            {/* API key */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {diagnostics.hasApiKey ? (
                  <CheckCircle2 className="h-4 w-4 text-mint-deep" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose" />
                )}
                <span className="text-sm text-slate">{t("settings.store.apiKey")}</span>
              </div>
              <span className="text-sm text-fog">
                {diagnostics.hasApiKey ? t("common.configured") : t("common.missing")}
              </span>
            </div>

            {/* Last webhook */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const freshness = webhookFreshness(diagnostics.lastRealWebhookAt);
                  if (freshness === "ok") return <CheckCircle2 className="h-4 w-4 text-mint-deep" />;
                  if (freshness === "warning") return <Clock className="h-4 w-4 text-amber-500" />;
                  return <XCircle className="h-4 w-4 text-rose" />;
                })()}
                <span className="text-sm text-slate">{t("settings.store.lastWebhookReceived")}</span>
              </div>
              <span className={cn(
                "text-sm",
                webhookFreshness(diagnostics.lastRealWebhookAt) === "ok" && "text-fog",
                webhookFreshness(diagnostics.lastRealWebhookAt) === "warning" && "text-amber-600 font-medium",
                webhookFreshness(diagnostics.lastRealWebhookAt) === "critical" && "text-rose font-medium",
                webhookFreshness(diagnostics.lastRealWebhookAt) === "none" && "text-rose font-medium",
              )}>
                {diagnostics.lastRealWebhookAt
                  ? timeAgo(diagnostics.lastRealWebhookAt)
                  : t("common.never")}
              </span>
            </div>

            {/* Token check */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {pingStatus === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-mint-deep" />
                ) : pingStatus === "expired" || pingStatus === "unreachable" ? (
                  <XCircle className="h-4 w-4 text-rose" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-mist" />
                )}
                <span className="text-sm text-slate">{t("settings.store.youcanToken")}</span>
              </div>
              <div className="flex items-center gap-2">
                {pingStatus === "loading" && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ocean" />
                )}
                {pingStatus === "ok" && (
                  <span className="text-sm text-mint-deep font-medium">
                    Valide ({pingLatency}ms)
                  </span>
                )}
                {pingStatus === "expired" && (
                  <span className="text-sm text-rose font-medium">{t("settings.store.expired")}</span>
                )}
                {pingStatus === "unreachable" && (
                  <span className="text-sm text-rose font-medium">{t("common.unreachable")}</span>
                )}
                {pingStatus === "no_token" && (
                  <span className="text-sm text-fog">{t("settings.store.noToken")}</span>
                )}
                {(pingStatus === "idle" || pingStatus === "expired" || pingStatus === "unreachable") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePing}
                    className="h-7 text-xs"
                  >
                    {t("common.check")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fog">{t("settings.store.diagnosticsLoadError")}</p>
        )}

        {/* Stats summary */}
        {diagnostics && (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-sm bg-snow px-3 py-2">
              <p className="text-xs text-fog">{t("settings.store.totalReceived")}</p>
              <p className="text-sm font-mono font-semibold text-midnight">
                {diagnostics.totalWebhooksReceived}
              </p>
            </div>
            <div className="rounded-sm bg-snow px-3 py-2">
              <p className="text-xs text-fog">{t("settings.store.last24h")}</p>
              <p className="text-sm font-mono font-semibold text-midnight">
                {diagnostics.totalWebhooksLast24h}
              </p>
            </div>
            {(diagnostics.queueStatus.failed > 0 || diagnostics.queueStatus.dead > 0) && (
              <div className="rounded-sm bg-rose-bg/30 px-3 py-2">
                <p className="text-xs text-rose">{t("settings.store.inError")}</p>
                <p className="text-sm font-mono font-semibold text-rose">
                  {diagnostics.queueStatus.failed + diagnostics.queueStatus.dead}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
