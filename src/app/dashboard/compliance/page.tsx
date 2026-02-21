"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, FileText, Eye, Trash2, Ban, Clock, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";

interface AuditLog {
  id: number;
  actor: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface DataRightsRequest {
  id: number;
  requesterPhoneHash: string;
  rightType: string;
  status: string;
  responseDeadline: string | null;
  completedAt: string | null;
  createdAt: string;
}

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
  data_rights_access: "compliance.audit.accessRequest",
  data_rights_delete: "compliance.audit.deletion",
  data_rights_oppose: "compliance.audit.objection",
  delete: "compliance.audit.deletion",
  data_purge: "compliance.audit.deletion",
  settings_change: "compliance.audit.settings",
  login: "compliance.audit.login",
  export: "compliance.audit.export",
  analytics_exported: "compliance.audit.export",
  report_exported: "compliance.audit.export",
};

const actorKeys: Record<string, string> = {
  system: "compliance.audit.system",
  merchant: "compliance.audit.merchant",
  consumer: "compliance.audit.consumer",
  admin: "compliance.audit.admin",
};

export default function CompliancePage() {
  const { t, locale } = useTranslation();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState<number>(0);
  const [dataRightsRequests, setDataRightsRequests] = useState<DataRightsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditRes, rightsRes] = await Promise.all([
        fetch("/api/dashboard/audit?per_page=8"),
        fetch("/api/data-rights/list?per_page=10"),
      ]);

      if (auditRes.ok) {
        const auditJson = await auditRes.json();
        setAuditLogs(auditJson.data ?? []);
        setAuditTotal(auditJson.meta?.total ?? 0);
      }

      if (rightsRes.ok) {
        const rightsJson = await rightsRes.json();
        setDataRightsRequests(rightsJson.data ?? []);
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mint" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-rose">{error}</p>
        <Button onClick={fetchData} size="sm">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

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
          <p className="mt-2 font-display text-lg font-bold text-midnight">
            {dataRightsRequests.filter((r) => r.rightType === "opposition").length}
          </p>
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
            {dataRightsRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-mist">
                {t("compliance.rights.empty") ?? "Aucune demande pour le moment"}
              </p>
            ) : (
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
                          <p className="font-mono text-xs text-mist">{req.requesterPhoneHash}</p>
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
            )}
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("compliance.audit.title")}</CardTitle>
            <CardDescription>{t("compliance.audit.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-mist">
                {t("compliance.audit.empty") ?? "Aucun log pour le moment"}
              </p>
            ) : (
              <div className="space-y-1">
                {auditLogs.map((log) => (
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
                          <span className="font-medium">
                            {actionKeys[log.action] ? t(actionKeys[log.action]) : log.action}
                          </span>
                          {log.targetType && log.targetId && (
                            <>
                              {" — "}
                              {log.targetType} #{log.targetId}
                            </>
                          )}
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
            )}
            <Button variant="outline" size="sm" className="mt-4 w-full">
              {t("compliance.audit.viewAll")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
