"use client";

import { useState } from "react";
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

export function StoreTab({ settings, onToast }: BaseTabProps) {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const isConnected = !!settings.youcanStoreId;

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/ingest`
      : "/api/webhook/ingest";

  const storeUrl = settings.domain
    ? `https://${settings.domain}`
    : null;

  const connectedDate = settings.consentRecordedAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(settings.consentRecordedAt))
    : null;

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

  return (
    <div className="space-y-6">
      {/* ═══ YouCan ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-sun" />
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
              <div className="rounded-sm border border-border divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-ink-3">Nom boutique</span>
                  <span className="text-sm font-medium text-ink-1">
                    {settings.name}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-ink-3">Store ID</span>
                  <span className="text-sm font-mono text-ink-2">
                    {settings.youcanStoreId}
                  </span>
                </div>
                {connectedDate && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-ink-3">
                      Connectée depuis
                    </span>
                    <span className="text-sm text-ink-2">{connectedDate}</span>
                  </div>
                )}
                {storeUrl && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-ink-3">URL de la boutique</span>
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
                  <Button variant="outline" size="sm" className="text-coral">
                    <Unplug className="mr-2 h-3.5 w-3.5" />
                    Déconnecter la boutique
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded bg-white p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-coral-light flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-coral" />
                      </div>
                      <Dialog.Title className="font-sora font-semibold text-ink-1 text-lg">
                        Déconnecter YouCan ?
                      </Dialog.Title>
                    </div>
                    <Dialog.Description className="text-sm text-ink-3 mb-6">
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
              <Globe className="h-10 w-10 text-ink-4 mx-auto mb-3" />
              <p className="text-sm text-ink-3 mb-4">
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
            <label className="text-sm font-medium text-ink-2 block mb-1.5">
              URL du webhook
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-sm border border-border bg-sand px-3 py-2 font-mono text-sm text-ink-2 select-all overflow-x-auto">
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
            <div className="rounded-xs bg-sand/50 px-3 py-2">
              <p className="text-xs text-ink-3">
                <span className="font-medium text-mint-deep">Dernier ping :</span>{" "}
                il y a 3 minutes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ Autres plateformes ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-ink-4" />
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
              "flex items-center justify-between rounded-sm border border-border p-4",
              "opacity-60"
            )}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xs bg-sand flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-ink-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-2">Shopify</p>
                  <p className="text-xs text-ink-4">E-commerce international</p>
                </div>
              </div>
              <Badge>Bientôt</Badge>
            </div>
            <div className={cn(
              "flex items-center justify-between rounded-sm border border-border p-4",
              "opacity-60"
            )}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xs bg-sand flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-ink-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-2">WooCommerce</p>
                  <p className="text-xs text-ink-4">WordPress e-commerce</p>
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
