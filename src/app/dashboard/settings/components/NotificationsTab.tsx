"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  Save,
  Loader2,
  Link2,
  Unlink,
  CheckCircle2,
  Eye,
  EyeOff,
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
import type { BaseTabProps } from "../types";

// ── Default preferences ──
interface EmailPrefs {
  order_auto_blocked: boolean;
  order_needs_review: boolean;
  order_flagged: boolean;
  escalation: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
  webhook_failed: boolean;
}

interface WhatsAppPrefs {
  verification: boolean;
  deliveryConfirmation: boolean;
  codReminder: boolean;
}

const DEFAULT_PREFS: EmailPrefs = {
  order_auto_blocked: true,
  order_needs_review: true,
  order_flagged: true,
  escalation: true,
  daily_summary: false,
  weekly_report: true,
  webhook_failed: true,
};

const DEFAULT_WA_PREFS: WhatsAppPrefs = {
  verification: false,
  deliveryConfirmation: false,
  codReminder: false,
};

// ── Toggle switch ──
function Toggle({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        enabled ? "bg-mint" : "bg-mist",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-5" : ""
        )}
      />
    </button>
  );
}

// ── Toggle row ──
function ToggleRow({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <p className={cn("text-sm font-medium", disabled ? "text-mist" : "text-slate")}>
          {label}
        </p>
        <p className={cn("text-xs mt-0.5", disabled ? "text-mist" : "text-fog")}>
          {description}
        </p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// Notification type definitions for the UI
const NOTIF_TYPES: { key: keyof EmailPrefs; labelKey: string; descKey: string }[] = [
  { key: "order_auto_blocked", labelKey: "settings.notifications.email.blocked", descKey: "settings.notifications.email.blockedDesc" },
  { key: "order_needs_review", labelKey: "settings.notifications.email.needsReview", descKey: "settings.notifications.email.needsReviewDesc" },
  { key: "order_flagged", labelKey: "settings.notifications.email.flagged", descKey: "settings.notifications.email.flaggedDesc" },
  { key: "escalation", labelKey: "settings.notifications.email.escalation", descKey: "settings.notifications.email.escalationDesc" },
  { key: "daily_summary", labelKey: "settings.notifications.email.dailySummary", descKey: "settings.notifications.email.dailySummaryDesc" },
  { key: "weekly_report", labelKey: "settings.notifications.email.weeklySummary", descKey: "settings.notifications.email.weeklySummaryDesc" },
  { key: "webhook_failed", labelKey: "settings.notifications.email.webhookFailed", descKey: "settings.notifications.email.webhookFailedDesc" },
];

// WhatsApp notification type definitions for the UI
const WA_NOTIF_TYPES: { key: keyof WhatsAppPrefs; labelKey: string; descKey: string }[] = [
  { key: "verification", labelKey: "settings.notifications.whatsapp.verification", descKey: "settings.notifications.whatsapp.verificationDesc" },
  { key: "deliveryConfirmation", labelKey: "settings.notifications.whatsapp.deliveryConfirmation", descKey: "settings.notifications.whatsapp.deliveryConfirmationDesc" },
  { key: "codReminder", labelKey: "settings.notifications.whatsapp.codReminder", descKey: "settings.notifications.whatsapp.codReminderDesc" },
];

function parsePrefs(raw: unknown): { email: EmailPrefs; whatsapp: WhatsAppPrefs } {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      email: { ...DEFAULT_PREFS, ...parsed?.email },
      whatsapp: { ...DEFAULT_WA_PREFS, ...parsed?.whatsapp },
    };
  } catch {
    return { email: DEFAULT_PREFS, whatsapp: DEFAULT_WA_PREFS };
  }
}

export function NotificationsTab({ settings, onToast, onRefresh }: BaseTabProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [savingWa, setSavingWa] = useState(false);

  // ── WhatsApp connection state ──
  const isWaConnected = !!settings.whatsappPhoneNumberId;
  const [connectingWa, setConnectingWa] = useState(false);
  const [disconnectingWa, setDisconnectingWa] = useState(false);
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Parse saved preferences
  const { email: savedEmailPrefs, whatsapp: savedWaPrefs } = parsePrefs(
    settings.notificationPreferences,
  );

  const [prefs, setPrefs] = useState<EmailPrefs>(savedEmailPrefs);
  const [waPrefs, setWaPrefs] = useState<WhatsAppPrefs>(savedWaPrefs);

  // Sync if settings change externally
  useEffect(() => {
    const { email, whatsapp } = parsePrefs(settings.notificationPreferences);
    setPrefs(email);
    setWaPrefs(whatsapp);
  }, [settings.notificationPreferences]);

  function updatePref(key: keyof EmailPrefs, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function updateWaPref(key: keyof WhatsAppPrefs, value: boolean) {
    setWaPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "notifications",
          notificationPreferences: { email: prefs, whatsapp: waPrefs },
        }),
      });
      if (res.ok) {
        await onRefresh();
        onToast("success", t("settings.notifications.email.saved"));
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        onToast("error", t("common.rateLimited", { seconds: retryAfter }));
      } else {
        onToast("error", t("common.error"));
      }
    } catch {
      onToast("error", t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWa() {
    setSavingWa(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "notifications",
          notificationPreferences: { email: prefs, whatsapp: waPrefs },
        }),
      });
      if (res.ok) {
        await onRefresh();
        onToast("success", t("settings.notifications.email.saved"));
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        onToast("error", t("common.rateLimited", { seconds: retryAfter }));
      } else {
        onToast("error", t("common.error"));
      }
    } catch {
      onToast("error", t("common.error"));
    } finally {
      setSavingWa(false);
    }
  }

  // ── WhatsApp connect / disconnect ──
  async function handleConnectWa() {
    if (!waPhoneNumberId.trim() || !waAccessToken.trim()) return;
    setConnectingWa(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "whatsapp",
          phoneNumberId: waPhoneNumberId.trim(),
          accessToken: waAccessToken.trim(),
        }),
      });
      if (res.ok) {
        setWaPhoneNumberId("");
        setWaAccessToken("");
        setShowToken(false);
        await onRefresh();
        onToast("success", t("settings.notifications.whatsapp.connectSuccess"));
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        onToast("error", t("common.rateLimited", { seconds: retryAfter }));
      } else {
        onToast("error", t("common.error"));
      }
    } catch {
      onToast("error", t("common.error"));
    } finally {
      setConnectingWa(false);
    }
  }

  async function handleDisconnectWa() {
    setDisconnectingWa(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _type: "whatsapp_disconnect" }),
      });
      if (res.ok) {
        await onRefresh();
        onToast("success", t("settings.notifications.whatsapp.disconnectSuccess"));
      } else {
        onToast("error", t("common.error"));
      }
    } catch {
      onToast("error", t("common.error"));
    } finally {
      setDisconnectingWa(false);
    }
  }

  // Mask phone number ID: show first 4 and last 4 chars
  function maskId(id: string) {
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}${"*".repeat(id.length - 8)}${id.slice(-4)}`;
  }

  return (
    <div className="space-y-6">
      {/* ═══ Notifications email ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">
                {t("settings.notifications.email.title")}
              </CardTitle>
              <CardDescription>
                {t("settings.notifications.email.subtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-silk">
            {NOTIF_TYPES.map(({ key, labelKey, descKey }) => (
              <ToggleRow
                key={key}
                label={t(labelKey)}
                description={t(descKey)}
                enabled={prefs[key]}
                onChange={(v) => updatePref(key, v)}
              />
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="mt-4"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t("settings.notifications.email.save")}
          </Button>
        </CardContent>
      </Card>

      {/* ═══ WhatsApp Configuration ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">
                {t("settings.notifications.whatsapp.setup")}
              </CardTitle>
              <CardDescription>
                {t("settings.notifications.whatsapp.setupDesc")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isWaConnected ? (
            /* ── Connected state ── */
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-mint/30 bg-mint/5 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-mint shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate">
                    {t("settings.notifications.whatsapp.connected")}
                  </p>
                  <p className="text-xs text-fog font-mono truncate">
                    {t("settings.notifications.whatsapp.phoneNumberId")}:{" "}
                    {maskId(settings.whatsappPhoneNumberId!)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectWa}
                  disabled={disconnectingWa}
                  className="shrink-0 text-red-500 border-red-200 hover:bg-red-50"
                >
                  {disconnectingWa ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {t("settings.notifications.whatsapp.disconnect")}
                </Button>
              </div>
            </div>
          ) : (
            /* ── Setup form ── */
            <div className="space-y-4">
              <p className="text-sm text-fog">
                {t("settings.notifications.whatsapp.notConfigured")}
              </p>

              {/* Phone Number ID */}
              <div>
                <label className="text-sm font-medium text-slate mb-1 block">
                  {t("settings.notifications.whatsapp.phoneNumberId")}
                </label>
                <input
                  type="text"
                  value={waPhoneNumberId}
                  onChange={(e) => setWaPhoneNumberId(e.target.value)}
                  placeholder={t("settings.notifications.whatsapp.phoneNumberIdPlaceholder")}
                  className="w-full rounded-md border border-silk bg-white px-3 py-2 text-sm text-slate placeholder:text-mist focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>

              {/* Access Token */}
              <div>
                <label className="text-sm font-medium text-slate mb-1 block">
                  {t("settings.notifications.whatsapp.accessToken")}
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={waAccessToken}
                    onChange={(e) => setWaAccessToken(e.target.value)}
                    placeholder={t("settings.notifications.whatsapp.accessTokenPlaceholder")}
                    className="w-full rounded-md border border-silk bg-white px-3 py-2 pr-10 text-sm text-slate placeholder:text-mist focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-fog hover:text-slate"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleConnectWa}
                disabled={connectingWa || !waPhoneNumberId.trim() || !waAccessToken.trim()}
              >
                {connectingWa ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                {t("settings.notifications.whatsapp.connect")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ WhatsApp notification toggles ═══ */}
      <Card className={cn(!isWaConnected && "opacity-50 pointer-events-none")}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">
                {t("settings.notifications.whatsapp.title")}
              </CardTitle>
              <CardDescription>
                {isWaConnected
                  ? t("settings.notifications.whatsapp.subtitle")
                  : t("settings.notifications.whatsapp.connectFirst")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-silk">
            {WA_NOTIF_TYPES.map(({ key, labelKey, descKey }) => (
              <ToggleRow
                key={key}
                label={t(labelKey)}
                description={t(descKey)}
                enabled={waPrefs[key]}
                onChange={(v) => updateWaPref(key, v)}
                disabled={!isWaConnected}
              />
            ))}
          </div>

          <Button
            onClick={handleSaveWa}
            disabled={savingWa || !isWaConnected}
            className="mt-4"
          >
            {savingWa ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t("settings.notifications.email.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
