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
import { Badge } from "@/components/ui/badge";
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

const DEFAULT_PREFS: EmailPrefs = {
  order_auto_blocked: true,
  order_needs_review: true,
  order_flagged: true,
  escalation: true,
  daily_summary: false,
  weekly_report: true,
  webhook_failed: true,
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

export function NotificationsTab({ settings, onToast, onRefresh }: BaseTabProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  // Parse saved preferences or use defaults
  const savedPrefs: EmailPrefs = (() => {
    try {
      if (settings.notificationPreferences) {
        const parsed = typeof settings.notificationPreferences === "string"
          ? JSON.parse(settings.notificationPreferences)
          : settings.notificationPreferences;
        return { ...DEFAULT_PREFS, ...parsed.email };
      }
    } catch { /* ignore parse errors */ }
    return DEFAULT_PREFS;
  })();

  const [prefs, setPrefs] = useState<EmailPrefs>(savedPrefs);

  // Sync if settings change externally
  useEffect(() => {
    try {
      if (settings.notificationPreferences) {
        const parsed = typeof settings.notificationPreferences === "string"
          ? JSON.parse(settings.notificationPreferences)
          : settings.notificationPreferences;
        setPrefs({ ...DEFAULT_PREFS, ...parsed.email });
      }
    } catch { /* ignore */ }
  }, [settings.notificationPreferences]);

  // WhatsApp toggles (disabled / coming soon)
  const [waVerify] = useState(false);
  const [waConfirm] = useState(false);
  const [waReminder] = useState(false);

  function updatePref(key: keyof EmailPrefs, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _type: "notifications",
          notificationPreferences: { email: prefs },
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-mist" />
              <div>
                <CardTitle className="text-base">
                  {t("settings.notifications.whatsapp.title")}
                </CardTitle>
                <CardDescription>
                  {t("settings.notifications.whatsapp.subtitle")}
                </CardDescription>
              </div>
            </div>
            <Badge>{t("common.soon")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="opacity-50 pointer-events-none">
          <div className="divide-y divide-silk">
            <ToggleRow
              label={t("settings.notifications.whatsapp.verification")}
              description={t("settings.notifications.whatsapp.verificationDesc")}
              enabled={waVerify}
              onChange={() => {}}
              disabled
            />
            <ToggleRow
              label={t("settings.notifications.whatsapp.deliveryConfirmation")}
              description={t("settings.notifications.whatsapp.deliveryConfirmationDesc")}
              enabled={waConfirm}
              onChange={() => {}}
              disabled
            />
            <ToggleRow
              label={t("settings.notifications.whatsapp.codReminder")}
              description={t("settings.notifications.whatsapp.codReminderDesc")}
              enabled={waReminder}
              onChange={() => {}}
              disabled
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
