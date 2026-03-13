"use client";

import { Eye } from "lucide-react";
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
import type { DataRightsRequest, PaginationMeta } from "./compliance-config";
import { rightTypeConfig, statusConfig } from "./compliance-config";

interface DataRightsListProps {
  dataRights: DataRightsRequest[];
  rightsMeta: PaginationMeta;
  rightsFilter: string;
  setRightsFilter: (f: string) => void;
  rightsStatusFilter: string;
  setRightsStatusFilter: (f: string) => void;
  fetchFilteredRights: (page?: number) => void;
}

const isDeadlineClose = (deadline: string | null) => {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 5 * 24 * 60 * 60 * 1000;
};

const isDeadlinePast = (deadline: string | null) => {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
};

export function DataRightsList({
  dataRights,
  rightsMeta,
  rightsFilter,
  setRightsFilter,
  rightsStatusFilter,
  setRightsStatusFilter,
  fetchFilteredRights,
}: DataRightsListProps) {
  const { t, locale } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{t("compliance.rights.title")}</CardTitle>
            <CardDescription>{t("compliance.rights.subtitle")}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {["all", "access", "deletion", "opposition"].map((f) => (
            <button
              key={f}
              onClick={() => setRightsFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-sm transition-colors ${
                rightsFilter === f
                  ? "bg-midnight text-white"
                  : "bg-snow text-fog hover:bg-silk"
              }`}
            >
              {f === "all" ? t("common.all") : t(rightTypeConfig[f]?.key ?? f)}
            </button>
          ))}
          <span className="w-px bg-silk mx-1" />
          {["all", "pending", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setRightsStatusFilter(f)}
              className={`px-2.5 py-1 text-xs rounded-sm transition-colors ${
                rightsStatusFilter === f
                  ? "bg-midnight text-white"
                  : "bg-snow text-fog hover:bg-silk"
              }`}
            >
              {f === "all" ? t("common.all") : t(statusConfig[f]?.key ?? f)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {dataRights.length === 0 ? (
          <p className="py-8 text-center text-sm text-mist">{t("compliance.rights.empty")}</p>
        ) : (
          <div className="space-y-2">
            {dataRights.map((req) => {
              const rc = rightTypeConfig[req.rightType];
              const sc = statusConfig[req.status];
              const RightIcon = rc?.icon ?? Eye;
              const deadlinePast = isDeadlinePast(req.responseDeadline);
              const deadlineClose = isDeadlineClose(req.responseDeadline);

              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-sm border border-silk p-3 hover:bg-snow/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`rounded-sm p-1.5 bg-${rc?.variant ?? "ocean"}/10`}>
                      <RightIcon className={`h-3.5 w-3.5 text-${rc?.variant ?? "ocean"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-midnight truncate">
                        {rc ? t(rc.key) : req.rightType}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-mist">
                        <span className="font-mono">{req.requesterPhoneHash}</span>
                        <span>·</span>
                        <span>{formatDate(req.createdAt, locale)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {req.responseDeadline && (deadlinePast || deadlineClose) && (
                      <Badge variant={deadlinePast ? "rose" : "amber"} className="text-[10px]">
                        {deadlinePast
                          ? t("compliance.rights.overdue")
                          : t("compliance.rights.duesSoon")}
                      </Badge>
                    )}
                    <Badge variant={sc?.variant ?? "default"}>
                      {sc ? t(sc.key) : req.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {rightsMeta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={rightsMeta.page <= 1}
              onClick={() => fetchFilteredRights(rightsMeta.page - 1)}
            >
              {t("common.previous")}
            </Button>
            <span className="flex items-center text-xs text-fog">
              {rightsMeta.page} / {rightsMeta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={rightsMeta.page >= rightsMeta.totalPages}
              onClick={() => fetchFilteredRights(rightsMeta.page + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
