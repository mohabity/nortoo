"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Unplug,
  Plug,
  Globe,
  Copy,
  Check,
  Webhook,
  ShoppingBag,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BaseTabProps } from "../types";

// ── Types ──

interface TestResult {
  orderId: number;
  score: number;
  decision: string;
  riskLevel: string;
  factors: Array<{ rule: string; points: number; reason: string }>;
  confidence: number;
  isTest: boolean;
  testOrder: {
    ref: string;
    customer: string;
    city: string;
    product: string;
    total: number;
  };
  durationMs: number;
}

interface Diagnostics {
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

const DECISION_LABELS: Record<string, string> = {
  ship: "Expédier",
  verify: "Vérifier",
  flag: "Signaler",
  block: "Bloquer",
};

const DECISION_COLORS: Record<string, string> = {
  ship: "text-mint-deep bg-mint-bg",
  verify: "text-sun-deep bg-sun-bg",
  flag: "text-coral bg-coral-bg",
  block: "text-violet bg-violet-bg",
};

// ── Component ──

export function StoreTab({ settings, onToast }: BaseTabProps) {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Test webhook state
  const [testState, setTestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [diagLoading, setDiagLoading] = useState(true);

  // Ping state
  const [pingStatus, setPingStatus] = useState<PingStatus>("idle");
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  const isConnected = !!settings.youcanStoreId;

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/ingest`
      : "/api/webhook/ingest";

  const storeUrl = settings.domain ? `https://${settings.domain}` : null;

  const connectedDate = settings.consentRecordedAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(settings.consentRecordedAt))
    : null;

  // Fetch diagnostics on mount
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

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      onToast("info", "Fonctionnalité bientôt disponible");
    } finally {
      setDisconnecting(false);
      setShowDisconnectModal(false);
    }
  }

  async function handleTestWebhook() {
    setTestState("loading");
    setTestResult(null);
    setTestError(null);

    try {
      const res = await fetch("/api/webhook/test", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setTestState("error");
        setTestError(json.error || "Erreur lors du test");
        return;
      }

      setTestResult(json.data);
      setTestState("success");

      // Auto-reset after 10 seconds
      setTimeout(() => {
        setTestState("idle");
        setTestResult(null);
      }, 10_000);
    } catch {
      setTestState("error");
      setTestError("Erreur réseau. Vérifiez votre connexion.");
    }
  }

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
    <div className="space-y-6">
      {/* ═══ YouCan ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-mint" />
              <div>
                <CardTitle className="text-base">YouCan</CardTitle>
                <CardDescription>
                  Connexion à votre boutique YouCan
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "mint" : "default"}>
              {isConnected ? "Connectée" : "Non connectée"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              {/* Store details */}
              <div className="rounded-sm border border-silk divide-y divide-silk">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-fog">Nom boutique</span>
                  <span className="text-sm font-medium text-midnight">
                    {settings.name}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-fog">Store ID</span>
                  <span className="text-sm font-mono text-slate">
                    {settings.youcanStoreId}
                  </span>
                </div>
                {connectedDate && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-fog">
                      Connectée depuis
                    </span>
                    <span className="text-sm text-slate">{connectedDate}</span>
                  </div>
                )}
                {storeUrl && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-fog">URL de la boutique</span>
                    <a
                      href={storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ocean hover:underline flex items-center gap-1"
                    >
                      {settings.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Disconnect button */}
              <Dialog.Root
                open={showDisconnectModal}
                onOpenChange={setShowDisconnectModal}
              >
                <Dialog.Trigger asChild>
                  <Button variant="outline" size="sm" className="text-rose">
                    <Unplug className="mr-2 h-3.5 w-3.5" />
                    Déconnecter la boutique
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
                        Déconnecter YouCan ?
                      </Dialog.Title>
                    </div>
                    <Dialog.Description className="text-sm text-fog mb-6">
                      Voulez-vous vraiment déconnecter votre boutique YouCan ?
                      Les nouveaux webhooks ne seront plus reçus et le scoring
                      automatique sera interrompu.
                    </Dialog.Description>
                    <div className="flex justify-end gap-3">
                      <Dialog.Close asChild>
                        <Button variant="outline">Annuler</Button>
                      </Dialog.Close>
                      <Button
                        variant="destructive"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                      >
                        {disconnecting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Déconnecter
                      </Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          ) : (
            <div className="text-center py-6">
              <Globe className="h-10 w-10 text-mist mx-auto mb-3" />
              <p className="text-sm text-fog mb-4">
                Connectez votre boutique YouCan pour activer le scoring
                automatique des commandes COD.
              </p>
              <Button asChild>
                <a href="/api/auth/youcan">
                  <Plug className="mr-2 h-4 w-4" />
                  Connecter YouCan
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Webhook ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-ocean" />
              <div>
                <CardTitle className="text-base">Webhook</CardTitle>
                <CardDescription>
                  Statut de réception des commandes
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? "mint" : "default"}>
              {isConnected ? "Actif" : "Inactif"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate block mb-1.5">
              URL du webhook
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-sm border border-silk bg-snow px-3 py-2 font-mono text-sm text-slate select-all overflow-x-auto">
                {webhookUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyText(webhookUrl)}
                title="Copier"
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
                <span className="font-medium text-mint-deep">Dernier webhook :</span>{" "}
                {diagLoading
                  ? "Chargement..."
                  : diagnostics?.lastRealWebhookAt
                    ? timeAgo(diagnostics.lastRealWebhookAt)
                    : "Aucun reçu"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Test de connexion ═══ */}
      {isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-sun" />
              <div>
                <CardTitle className="text-base">Test de connexion</CardTitle>
                <CardDescription>
                  Envoyez une commande test pour vérifier le scoring
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test button */}
            {testState === "idle" && (
              <Button onClick={handleTestWebhook} className="w-full sm:w-auto">
                <Play className="mr-2 h-4 w-4" />
                Envoyer une commande test
              </Button>
            )}

            {/* Loading state */}
            {testState === "loading" && (
              <div className="flex items-center gap-3 rounded-sm border border-silk bg-snow px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-ocean" />
                <div>
                  <p className="text-sm font-medium text-midnight">Envoi en cours...</p>
                  <p className="text-xs text-fog">Scoring de la commande test</p>
                </div>
              </div>
            )}

            {/* Success result */}
            {testState === "success" && testResult && (
              <div className="rounded-sm border border-mint bg-mint-bg/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-mint-deep" />
                  <p className="text-sm font-semibold text-mint-deep">
                    Test réussi en {testResult.durationMs}ms
                  </p>
                </div>

                <div className="rounded-sm border border-silk bg-white divide-y divide-silk">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Référence</span>
                    <span className="text-xs font-mono font-medium text-midnight">
                      {testResult.testOrder.ref}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Score</span>
                    <span className="text-xs font-mono font-bold text-midnight">
                      {testResult.score}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Décision</span>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      DECISION_COLORS[testResult.decision] || "text-slate bg-snow"
                    )}>
                      {DECISION_LABELS[testResult.decision] || testResult.decision}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Client</span>
                    <span className="text-xs text-slate">{testResult.testOrder.customer}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Ville</span>
                    <span className="text-xs text-slate">{testResult.testOrder.city}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Produit</span>
                    <span className="text-xs text-slate">{testResult.testOrder.product}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Montant</span>
                    <span className="text-xs font-mono text-slate">
                      {testResult.testOrder.total} DH
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-fog">Confiance</span>
                    <span className="text-xs text-slate">
                      {Math.round(testResult.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestWebhook}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Relancer un test
                </Button>
              </div>
            )}

            {/* Error state */}
            {testState === "error" && (
              <div className="rounded-sm border border-rose bg-rose-bg/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose" />
                  <p className="text-sm font-semibold text-rose">Échec du test</p>
                </div>
                <p className="text-sm text-fog">{testError}</p>
                <div className="text-xs text-fog space-y-1">
                  <p>Suggestions :</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Vérifiez que votre clé API est configurée</li>
                    <li>Vérifiez votre connexion internet</li>
                    <li>Limite : 5 tests par heure</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestWebhook}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Réessayer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Diagnostics ═══ */}
      {isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-ocean" />
              <div>
                <CardTitle className="text-base">Diagnostics</CardTitle>
                <CardDescription>
                  État de votre connexion webhook
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {diagLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-mist" />
                <span className="text-sm text-fog">Chargement des diagnostics...</span>
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
                    <span className="text-sm text-slate">Boutique connectée</span>
                  </div>
                  <span className="text-sm text-fog">
                    {diagnostics.storeConnected ? diagnostics.storeName : "Non"}
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
                    <span className="text-sm text-slate">Clé API</span>
                  </div>
                  <span className="text-sm text-fog">
                    {diagnostics.hasApiKey ? "Configurée" : "Absente"}
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
                    <span className="text-sm text-slate">Dernier webhook reçu</span>
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
                      : "Jamais"}
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
                    <span className="text-sm text-slate">Token YouCan</span>
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
                      <span className="text-sm text-rose font-medium">Expiré</span>
                    )}
                    {pingStatus === "unreachable" && (
                      <span className="text-sm text-rose font-medium">Injoignable</span>
                    )}
                    {pingStatus === "no_token" && (
                      <span className="text-sm text-fog">Aucun token</span>
                    )}
                    {(pingStatus === "idle" || pingStatus === "expired" || pingStatus === "unreachable") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePing}
                        className="h-7 text-xs"
                      >
                        Vérifier
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-fog">Impossible de charger les diagnostics.</p>
            )}

            {/* Stats summary */}
            {diagnostics && (
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-sm bg-snow px-3 py-2">
                  <p className="text-xs text-fog">Total reçus</p>
                  <p className="text-sm font-mono font-semibold text-midnight">
                    {diagnostics.totalWebhooksReceived}
                  </p>
                </div>
                <div className="rounded-sm bg-snow px-3 py-2">
                  <p className="text-xs text-fog">Dernières 24h</p>
                  <p className="text-sm font-mono font-semibold text-midnight">
                    {diagnostics.totalWebhooksLast24h}
                  </p>
                </div>
                {(diagnostics.queueStatus.failed > 0 || diagnostics.queueStatus.dead > 0) && (
                  <div className="rounded-sm bg-rose-bg/30 px-3 py-2">
                    <p className="text-xs text-rose">En erreur</p>
                    <p className="text-sm font-mono font-semibold text-rose">
                      {diagnostics.queueStatus.failed + diagnostics.queueStatus.dead}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ Autres plateformes ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-mist" />
            <div>
              <CardTitle className="text-base">Autres plateformes</CardTitle>
              <CardDescription>
                Intégrations à venir
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
                  <p className="text-sm font-medium text-slate">Shopify</p>
                  <p className="text-xs text-mist">E-commerce international</p>
                </div>
              </div>
              <Badge>Bientôt</Badge>
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
                  <p className="text-sm font-medium text-slate">WooCommerce</p>
                  <p className="text-xs text-mist">WordPress e-commerce</p>
                </div>
              </div>
              <Badge>Bientôt</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
