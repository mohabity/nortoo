"use client";

import { useState } from "react";
import {
  Store,
  Unplug,
  Plug,
  Globe,
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
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";

// ── Types ──

interface StoreInfoProps {
  isConnected: boolean;
  name: string;
  youcanStoreId: string | null;
  domain: string | null;
  consentRecordedAt: string | null;
  onToast: (type: "info" | "success" | "error", message: string) => void;
}

// ── Component ──

export function StoreInfo({
  isConnected,
  name,
  youcanStoreId,
  domain,
  consentRecordedAt,
  onToast,
}: StoreInfoProps) {
  const { t, locale } = useTranslation();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const storeUrl = domain ? `https://${domain}` : null;

  const connectedDate = consentRecordedAt
    ? formatDate(consentRecordedAt, locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">{t("settings.store.youcan")}</CardTitle>
              <CardDescription>
                {t("settings.store.connectionTitle")}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "mint" : "default"}>
            {isConnected ? t("settings.store.connected") : t("settings.store.notConnected")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            {/* Store details */}
            <div className="rounded-sm border border-silk divide-y divide-silk">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-fog">{t("settings.store.storeName")}</span>
                <span className="text-sm font-medium text-midnight">
                  {name}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-fog">{t("settings.store.storeId")}</span>
                <span className="text-sm font-mono text-slate">
                  {youcanStoreId}
                </span>
              </div>
              {connectedDate && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-fog">
                    {t("settings.store.connectedSince")}
                  </span>
                  <span className="text-sm text-slate">{connectedDate}</span>
                </div>
              )}
              {storeUrl && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-fog">{t("settings.store.storeUrl")}</span>
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-ocean hover:underline flex items-center gap-1"
                  >
                    {domain}
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
                  {t("settings.store.disconnect")}
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
                      {t("settings.store.disconnectTitle")}
                    </Dialog.Title>
                  </div>
                  <Dialog.Description className="text-sm text-fog mb-6">
                    {t("settings.store.disconnectMessage")}
                  </Dialog.Description>
                  <div className="flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <Button variant="outline">{t("common.cancel")}</Button>
                    </Dialog.Close>
                    <Button
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("settings.store.disconnect")}
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
              {t("settings.store.connectPrompt")}
            </p>
            <Button asChild>
              <a href="/api/auth/youcan">
                <Plug className="mr-2 h-4 w-4" />
                {t("settings.store.connectYoucan")}
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
