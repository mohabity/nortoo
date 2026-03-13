"use client";

import { Shield, Clock, FileText, Ban, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/i18n/provider";

interface ComplianceKpisProps {
  auditTotal: number;
  oppositionCount: number;
}

export function ComplianceKpis({ auditTotal, oppositionCount }: ComplianceKpisProps) {
  const { t, locale } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-mint" />
          <p className="text-xs font-medium text-fog">{t("compliance.cards.hashing")}</p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="font-display text-lg font-bold text-mint-deep">{t("compliance.cards.hashingActive")}</p>
          <CheckCircle2 className="h-4 w-4 text-mint" />
        </div>
        <p className="text-xs text-mist">{t("compliance.cards.hashingMethod")}</p>
      </div>

      <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber" />
          <p className="text-xs font-medium text-fog">{t("compliance.cards.retention")}</p>
        </div>
        <p className="mt-2 font-display text-lg font-bold text-midnight">{t("compliance.cards.retentionPeriod")}</p>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-silk overflow-hidden">
          <div className="h-full rounded-full bg-amber" style={{ width: "100%" }} />
        </div>
        <p className="mt-1 text-xs text-mist">{t("compliance.cards.retentionSchedule")}</p>
      </div>

      <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-ocean" />
          <p className="text-xs font-medium text-fog">{t("compliance.cards.auditLog")}</p>
        </div>
        <p className="mt-2 font-display text-lg font-bold text-midnight">
          {auditTotal.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
        </p>
        <p className="text-xs text-mist">{t("compliance.cards.auditLogEntries")}</p>
      </div>

      <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
        <div className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-violet" />
          <p className="text-xs font-medium text-fog">{t("compliance.cards.objections")}</p>
        </div>
        <p className="mt-2 font-display text-lg font-bold text-midnight">{oppositionCount}</p>
        <p className="text-xs text-mist">{t("compliance.cards.objectionsCount")}</p>
      </div>
    </div>
  );
}
