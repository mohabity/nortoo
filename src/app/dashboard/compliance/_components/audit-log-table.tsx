"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";
import type { AuditLog, PaginationMeta } from "./compliance-config";
import { actionConfig, actorKeys } from "./compliance-config";

interface AuditLogTableProps {
  auditLogs: AuditLog[];
  auditMeta: PaginationMeta;
  auditActorFilter: string;
  setAuditActorFilter: (f: string) => void;
  fetchFilteredAudit: (page?: number) => void;
}

export function AuditLogTable({
  auditLogs,
  auditMeta,
  auditActorFilter,
  setAuditActorFilter,
  fetchFilteredAudit,
}: AuditLogTableProps) {
  const { t, locale } = useTranslation();
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">{t("compliance.audit.title")}</CardTitle>
          <CardDescription>{t("compliance.audit.subtitle")}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {["all", "system", "merchant", "admin"].map((f) => (
            <button
              key={f}
              onClick={() => setAuditActorFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-sm transition-colors ${
                auditActorFilter === f
                  ? "bg-midnight text-white"
                  : "bg-snow text-fog hover:bg-silk"
              }`}
            >
              {f === "all" ? t("common.all") : t(actorKeys[f] ?? f)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-mist">{t("compliance.audit.empty")}</p>
        ) : (
          <div className="space-y-1">
            {auditLogs.map((log) => {
              const ac = actionConfig[log.action];
              const ActionIcon = ac?.icon ?? FileText;
              const isExpanded = expandedLogId === log.id;

              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex w-full items-center justify-between rounded-xs px-3 py-2 hover:bg-snow/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ActionIcon className="h-3.5 w-3.5 text-fog shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-slate truncate">
                          <span className="font-medium">
                            {ac ? t(ac.key) : log.action}
                          </span>
                          {log.targetType && log.targetId && (
                            <span className="text-mist">
                              {" — "}
                              {log.targetType} #{log.targetId}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="default" className="text-[10px]">
                        {actorKeys[log.actor] ? t(actorKeys[log.actor]) : log.actor}
                      </Badge>
                      <span className="text-xs text-mist">
                        {formatDate(log.createdAt, locale, {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {log.details && (
                        isExpanded
                          ? <ChevronUp className="h-3 w-3 text-mist" />
                          : <ChevronDown className="h-3 w-3 text-mist" />
                      )}
                    </div>
                  </button>
                  {isExpanded && log.details && (
                    <div className="ml-10 mr-3 mb-2 rounded-sm bg-snow border border-silk p-3">
                      <pre className="text-xs text-fog font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {auditMeta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={auditMeta.page <= 1}
              onClick={() => fetchFilteredAudit(auditMeta.page - 1)}
            >
              {t("common.previous")}
            </Button>
            <span className="flex items-center text-xs text-fog">
              {auditMeta.page} / {auditMeta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={auditMeta.page >= auditMeta.totalPages}
              onClick={() => fetchFilteredAudit(auditMeta.page + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
