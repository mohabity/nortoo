"use client";

import { Shield, FileText, Eye, Trash2, Ban, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";

// Mock data rights requests
const dataRightsRequests = [
  {
    id: 1,
    phoneHash: "a3f2...8c41",
    rightType: "access",
    status: "completed",
    createdAt: "2026-02-10T14:30:00Z",
    deadline: "2026-03-12T14:30:00Z",
  },
  {
    id: 2,
    phoneHash: "b7e1...2d55",
    rightType: "deletion",
    status: "processing",
    createdAt: "2026-02-15T09:00:00Z",
    deadline: "2026-03-17T09:00:00Z",
  },
  {
    id: 3,
    phoneHash: "c9d4...6f78",
    rightType: "opposition",
    status: "completed",
    createdAt: "2026-02-05T11:20:00Z",
    deadline: "2026-03-07T11:20:00Z",
  },
];

// Mock audit logs
const recentAuditLogs = [
  { id: 1, actor: "system", action: "score", target: "Commande #1847", createdAt: "2026-02-18T10:30:01Z" },
  { id: 2, actor: "system", action: "score", target: "Commande #1848", createdAt: "2026-02-18T09:15:02Z" },
  { id: 3, actor: "merchant", action: "override", target: "Commande #1840", createdAt: "2026-02-17T16:00:00Z" },
  { id: 4, actor: "system", action: "score", target: "Commande #1849", createdAt: "2026-02-18T08:45:01Z" },
  { id: 5, actor: "consumer", action: "access_request", target: "Client a3f2...8c41", createdAt: "2026-02-10T14:30:00Z" },
  { id: 6, actor: "merchant", action: "settings_change", target: "Seuils scoring", createdAt: "2026-02-08T10:00:00Z" },
  { id: 7, actor: "system", action: "delete", target: "Données expirées (12 fiches)", createdAt: "2026-02-18T03:00:00Z" },
  { id: 8, actor: "consumer", action: "access_request", target: "Client c9d4...6f78", createdAt: "2026-02-05T11:20:00Z" },
];

const rightTypeKeys: Record<string, { key: string; icon: typeof Eye }> = {
  access: { key: "compliance.rights.access", icon: Eye },
  deletion: { key: "compliance.rights.deletion", icon: Trash2 },
  opposition: { key: "compliance.rights.objection", icon: Ban },
};

const statusKeys: Record<string, { key: string; variant: "mint" | "amber" | "default" | "rose" }> = {
  pending: { key: "compliance.rights.statusPending", variant: "amber" },
  processing: { key: "compliance.rights.statusInProgress", variant: "amber" },
  completed: { key: "compliance.rights.statusProcessed", variant: "mint" },
  refused: { key: "compliance.rights.statusRejected", variant: "rose" },
};

const actionKeys: Record<string, string> = {
  score: "compliance.audit.scoring",
  override: "compliance.audit.override",
  access_request: "compliance.audit.accessRequest",
  delete: "compliance.audit.deletion",
  settings_change: "compliance.audit.settings",
  login: "compliance.audit.login",
  export: "compliance.audit.export",
};

const actorKeys: Record<string, string> = {
  system: "compliance.audit.system",
  merchant: "compliance.audit.merchant",
  consumer: "compliance.audit.consumer",
  admin: "compliance.audit.admin",
};

export default function CompliancePage() {
  const { t, locale } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">{t("compliance.title")}</h1>
        <p className="text-sm text-fog">
          {t("compliance.subtitle")}
        </p>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-mint" />
            <p className="text-xs font-medium text-fog">{t("compliance.cards.hashing")}</p>
          </div>
          <p className="mt-2 font-display text-lg font-bold text-mint-deep">{t("compliance.cards.hashingActive")}</p>
          <p className="text-xs text-mist">{t("compliance.cards.hashingMethod")}</p>
        </div>
        <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber" />
            <p className="text-xs font-medium text-fog">{t("compliance.cards.retention")}</p>
          </div>
          <p className="mt-2 font-display text-lg font-bold text-midnight">{t("compliance.cards.retentionPeriod")}</p>
          <p className="text-xs text-mist">{t("compliance.cards.retentionSchedule")}</p>
        </div>
        <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ocean" />
            <p className="text-xs font-medium text-fog">{t("compliance.cards.auditLog")}</p>
          </div>
          <p className="mt-2 font-display text-lg font-bold text-midnight">1 247</p>
          <p className="text-xs text-mist">{t("compliance.cards.auditLogEntries")}</p>
        </div>
        <div className="rounded bg-white border border-silk shadow-[0_2px_8px_rgba(0,0,0,.06)] p-4">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-violet" />
            <p className="text-xs font-medium text-fog">{t("compliance.cards.objections")}</p>
          </div>
          <p className="mt-2 font-display text-lg font-bold text-midnight">3</p>
          <p className="text-xs text-mist">{t("compliance.cards.objectionsCount")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Data Rights Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("compliance.rights.title")}</CardTitle>
            <CardDescription>{t("compliance.rights.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataRightsRequests.map((req) => {
                const rightConfig = rightTypeKeys[req.rightType];
                const statusConfig = statusKeys[req.status];
                const RightIcon = rightConfig?.icon ?? Eye;

                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-sm border border-silk p-3"
                  >
                    <div className="flex items-center gap-3">
                      <RightIcon className="h-4 w-4 text-fog" />
                      <div>
                        <p className="text-sm font-medium text-midnight">
                          {rightConfig ? t(rightConfig.key) : req.rightType}
                        </p>
                        <p className="font-mono text-xs text-mist">{req.phoneHash}</p>
                        <p className="text-xs text-mist">
                          {formatDate(req.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusConfig?.variant ?? "default"}>
                      {statusConfig ? t(statusConfig.key) : req.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("compliance.audit.title")}</CardTitle>
            <CardDescription>{t("compliance.audit.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xs px-3 py-2 hover:bg-snow/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="default" className="shrink-0">
                      {actorKeys[log.actor] ? t(actorKeys[log.actor]) : log.actor}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm text-slate truncate">
                        <span className="font-medium">{actionKeys[log.action] ? t(actionKeys[log.action]) : log.action}</span>
                        {" — "}
                        {log.target}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-mist ml-2">
                    {formatDate(log.createdAt, locale, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              {t("compliance.audit.viewAll")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
