"use client";

import { useState } from "react";
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
  children,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
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
        {children}
      </div>
      <Toggle enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function NotificationsTab({ onToast }: BaseTabProps) {
  const { t } = useTranslation();
  // Email notification toggles
  const [blockedOrders, setBlockedOrders] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [rtoAlert, setRtoAlert] = useState(false);
  const [rtoThreshold, setRtoThreshold] = useState(30);
  const [saving, setSaving] = useState(false);

  // WhatsApp toggles (disabled)
  const [waVerify] = useState(false);
  const [waConfirm] = useState(false);
  const [waReminder] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      onToast("info", "Fonctionnalité bientôt disponible");
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
            <ToggleRow
              label={t("settings.notifications.email.blocked")}
              description={t("settings.notifications.email.blockedDesc")}
              enabled={blockedOrders}
              onChange={setBlockedOrders}
            />
            <ToggleRow
              label={t("settings.notifications.email.dailySummary")}
              description={t("settings.notifications.email.dailySummaryDesc")}
              enabled={dailySummary}
              onChange={setDailySummary}
            />
            <ToggleRow
              label={t("settings.notifications.email.weeklySummary")}
              description={t("settings.notifications.email.weeklySummaryDesc")}
              enabled={weeklySummary}
              onChange={setWeeklySummary}
            />
            <ToggleRow
              label={t("settings.notifications.email.rtoAlert")}
              description={t("settings.notifications.email.rtoAlertDesc")}
              enabled={rtoAlert}
              onChange={setRtoAlert}
            >
              {rtoAlert && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs text-fog">{t("settings.notifications.email.threshold")}</label>
                  <input
                    type="number"
                    min={10}
                    max={80}
                    value={rtoThreshold}
                    onChange={(e) => setRtoThreshold(Number(e.target.value))}
                    className="w-16 rounded-xs border border-silk bg-white px-2 py-1 text-sm font-mono text-midnight focus:outline-none focus:ring-2 focus:ring-mint/50"
                  />
                  <span className="text-xs text-fog">%</span>
                </div>
              )}
            </ToggleRow>
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
