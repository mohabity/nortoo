"use client";

import { useState, useEffect } from "react";
import { Bell, MessageSquare, Save, Loader2 } from "lucide-react";
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
        disabled && "cursor-not-allowed"
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

      {/* ═══ WhatsApp ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">
                {t("settings.notifications.whatsapp.title")}
              </CardTitle>
              <CardDescription>
                {t("settings.notifications.whatsapp.subtitle")}
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
              />
            ))}
          </div>

          <Button
            onClick={handleSaveWa}
            disabled={savingWa}
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
