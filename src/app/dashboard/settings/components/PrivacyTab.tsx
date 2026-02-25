"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Download,
  Pencil,
  Trash2,
  Ban,
  Clock,
  Server,
  Loader2,
  FileText,
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
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";
import type { BaseTabProps } from "../types";

// ── Data right action ──
interface RightActionDef {
  icon: React.ElementType;
  titleKey: string;
  descriptionKey: string;
  buttonLabelKey: string;
  article: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

const DATA_RIGHTS: RightActionDef[] = [
  {
    icon: Download,
    titleKey: "settings.privacy.exportTitle",
    descriptionKey: "settings.privacy.exportDescription",
    buttonLabelKey: "settings.privacy.exportButton",
    article: "Art. 7",
    variant: "outline",
  },
  {
    icon: Pencil,
    titleKey: "settings.privacy.rectifyTitle",
    descriptionKey: "settings.privacy.rectifyDescription",
    buttonLabelKey: "settings.privacy.rectifyButton",
    article: "Art. 7",
    variant: "outline",
  },
  {
    icon: Trash2,
    titleKey: "settings.privacy.deleteTitle",
    descriptionKey: "settings.privacy.deleteDescription",
    buttonLabelKey: "settings.privacy.deleteButton",
    article: "Art. 8",
    variant: "destructive",
  },
  {
    icon: Ban,
    titleKey: "settings.privacy.objectTitle",
    descriptionKey: "settings.privacy.objectDescription",
    buttonLabelKey: "settings.privacy.objectButton",
    article: "Art. 9",
    variant: "outline",
  },
];

// ── Sub-processors ──
const SUB_PROCESSORS = [
  {
    name: "Neon",
    serviceKey: "settings.privacy.neonService",
    location: "EU Frankfurt",
    purposeKey: "settings.privacy.neonPurpose",
  },
  {
    name: "Vercel",
    serviceKey: "settings.privacy.vercelService",
    location: "EU Frankfurt (fra1)",
    purposeKey: "settings.privacy.vercelPurpose",
  },
  {
    name: "Upstash",
    serviceKey: "settings.privacy.upstashService",
    location: "EU Frankfurt",
    purposeKey: "settings.privacy.upstashPurpose",
  },
];

const RETENTION_OPTIONS = [6, 12, 18, 24, 36, 48, 60];

export function PrivacyTab({ settings, onToast, onRefresh }: BaseTabProps) {
  const { t, locale } = useTranslation();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [retentionMonths, setRetentionMonths] = useState(settings.dataRetentionMonths ?? 24);
  const retentionChanged = retentionMonths !== (settings.dataRetentionMonths ?? 24);

  const connectedDate = settings.consentRecordedAt
    ? formatDate(settings.consentRecordedAt, locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  async function handleDataRight(title: string) {
    setLoadingAction(title);
    try {
      await new Promise((r) => setTimeout(r, 600));
      onToast(
        "info",
        t("settings.privacy.requestSubmitted")
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSaveRetention() {
    setLoadingAction("retention");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _type: "retention", dataRetentionMonths: retentionMonths }),
      });
      if (res.ok) {
        onToast("success", t("settings.privacy.retentionSaved"));
        await onRefresh();
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        onToast("error", t("common.rateLimited", { seconds: retryAfter }));
      } else {
        onToast("error", t("common.error"));
      }
    } catch {
      onToast("error", t("common.error"));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRecordConsent() {
    setLoadingAction("consent");
    try {
      const res = await fetch("/api/settings/consent", { method: "POST" });
      if (res.ok) {
        onToast("success", t("settings.privacy.consentRecordedSuccess"));
        await onRefresh();
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        onToast("error", t("common.rateLimited", { seconds: retryAfter }));
      } else {
        onToast("error", t("common.error"));
      }
    } catch {
      onToast("error", t("common.error"));
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ Conformité Loi 09-08 ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-mint" />
            <div>
              <CardTitle className="text-base">
                {t("settings.privacy.complianceTitle")}
              </CardTitle>
              <CardDescription>
                {t("settings.privacy.complianceSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate">
            {t("settings.privacy.complianceText")}
          </p>

          <div className="rounded-sm border border-silk divide-y divide-silk">
            {settings.cndpDeclarationRef && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-fog">
                  {t("settings.privacy.cndpRef")}
                </span>
                <Badge variant="mint">{settings.cndpDeclarationRef}</Badge>
              </div>
            )}
            {connectedDate ? (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-fog">
                  {t("settings.privacy.consentRecorded")}
                </span>
                <span className="text-sm text-slate">{connectedDate}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <span className="text-sm text-fog">
                    {t("settings.privacy.consentNotRecorded")}
                  </span>
                  <p className="text-xs text-mist mt-0.5">
                    {t("settings.privacy.consentNotRecordedDesc")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRecordConsent}
                  disabled={loadingAction === "consent"}
                  className="shrink-0"
                >
                  {loadingAction === "consent" && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  {t("settings.privacy.recordConsent")}
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-fog">
                {t("settings.privacy.retentionPeriod")}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={retentionMonths}
                  onChange={(e) => setRetentionMonths(Number(e.target.value))}
                  className="rounded-md border border-silk bg-white px-2.5 py-1.5 text-sm font-medium text-midnight focus:outline-none focus:ring-2 focus:ring-mint/40"
                >
                  {RETENTION_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {t("settings.privacy.retentionMonths", { count: String(m) })}
                    </option>
                  ))}
                </select>
                {retentionChanged && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveRetention}
                    disabled={loadingAction === "retention"}
                    className="shrink-0"
                  >
                    {loadingAction === "retention" && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    {t("common.save")}
                  </Button>
                )}
              </div>
            </div>
            {retentionChanged && (
              <div className="px-4 pb-3">
                <p className="text-xs text-mist">
                  {t("settings.privacy.retentionWarning")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Vos droits (Art. 7-9) ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-ocean" />
            <div>
              <CardTitle className="text-base">
                {t("settings.privacy.rightsTitle")}
              </CardTitle>
              <CardDescription>
                {t("settings.privacy.rightsSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DATA_RIGHTS.map((right) => {
              const Icon = right.icon;
              const title = t(right.titleKey);
              const isLoading = loadingAction === right.titleKey;
              return (
                <div
                  key={right.titleKey}
                  className="flex items-start justify-between gap-4 rounded-sm border border-silk p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-8 w-8 rounded-xs bg-snow flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-fog" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-midnight">
                          {title}
                        </p>
                        <Badge variant="ocean" className="text-[10px]">
                          {right.article}
                        </Badge>
                      </div>
                      <p className="text-xs text-fog mt-0.5">
                        {t(right.descriptionKey)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={right.variant as "outline" | "destructive" | undefined}
                    size="sm"
                    onClick={() => handleDataRight(right.titleKey)}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    {isLoading && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    {t(right.buttonLabelKey)}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Conservation des données ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet" />
            <div>
              <CardTitle className="text-base">
                {t("settings.privacy.dataRetentionTitle")}
              </CardTitle>
              <CardDescription>
                {t("settings.privacy.dataRetentionSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate">
            {t("settings.privacy.dataRetentionText", { months: String(settings.dataRetentionMonths) })}
          </p>
          <p className="text-sm text-fog">
            {t("settings.privacy.dataRetentionAutoDelete")}
          </p>
        </CardContent>
      </Card>

      {/* ═══ Sous-traitants (Art. 25) ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-fog" />
            <div>
              <CardTitle className="text-base">
                {t("settings.privacy.subProcessorsTitle")}
              </CardTitle>
              <CardDescription>
                {t("settings.privacy.subProcessorsSubtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silk">
                  <th className="pb-2 text-left font-medium text-fog">
                    {t("settings.privacy.processor")}
                  </th>
                  <th className="pb-2 text-left font-medium text-fog">
                    {t("settings.privacy.service")}
                  </th>
                  <th className="pb-2 text-left font-medium text-fog">
                    {t("settings.privacy.location")}
                  </th>
                  <th className="pb-2 text-left font-medium text-fog">
                    {t("settings.privacy.purpose")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silk">
                {SUB_PROCESSORS.map((sp) => (
                  <tr key={sp.name}>
                    <td className="py-2.5 font-medium text-midnight">
                      {sp.name}
                    </td>
                    <td className="py-2.5 text-slate">{t(sp.serviceKey)}</td>
                    <td className="py-2.5">
                      <Badge variant="mint" className="text-[10px]">
                        {sp.location}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-fog">{t(sp.purposeKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xs bg-snow px-3 py-2">
            <p className="text-xs text-fog">
              {t("settings.privacy.subProcessorsFooter")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
