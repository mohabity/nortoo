"use client";

import { Eye, Trash2, Ban, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
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
import { useComplianceData } from "@/hooks/use-compliance-data";
import { ActionModal } from "./_components/action-modal";
import { ComplianceKpis } from "./_components/compliance-kpis";
import { AuditLogTable } from "./_components/audit-log-table";
import { DataRightsList } from "./_components/data-rights-list";
import { CndpBanner } from "./_components/cndp-banner";

export default function CompliancePage() {
  const { t, locale } = useTranslation();

  const {
    auditLogs,
    auditTotal,
    auditMeta,
    dataRights,
    rightsMeta,
    oppositionCount,
    cndpRef,
    loading,
    error,
    rightsFilter,
    setRightsFilter,
    rightsStatusFilter,
    setRightsStatusFilter,
    auditActorFilter,
    setAuditActorFilter,
    fetchFilteredRights,
    fetchFilteredAudit,
    fetchData,
    activeModal,
    setActiveModal,
    actionLoading,
    accessResult,
    setAccessResult,
    deleteResult,
    setDeleteResult,
    opposeResult,
    setOpposeResult,
    handleAccess,
    handleDelete,
    handleOppose,
    copyPublicLink,
  } = useComplianceData();

  // ── Loading / Error ──
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
        <Button onClick={fetchData} size="sm">{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-midnight">{t("compliance.title")}</h1>
          <p className="text-sm text-fog">{t("compliance.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copyPublicLink} className="gap-2">
          <ExternalLink className="h-3.5 w-3.5" />
          {t("compliance.publicForm")}
        </Button>
      </div>

      {/* CNDP Banner */}
      <CndpBanner cndpRef={cndpRef} />

      {/* KPI Cards */}
      <ComplianceKpis auditTotal={auditTotal} oppositionCount={oppositionCount} />

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("compliance.actions.title")}</CardTitle>
          <CardDescription>{t("compliance.actions.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => { setActiveModal("access"); setAccessResult(null); }}
              className="flex items-center gap-3 rounded border border-silk p-4 hover:border-ocean/40 hover:bg-ocean/5 transition-colors text-left group"
            >
              <div className="rounded-sm bg-ocean/10 p-2.5 group-hover:bg-ocean/20 transition-colors">
                <Eye className="h-4 w-4 text-ocean" />
              </div>
              <div>
                <p className="text-sm font-medium text-midnight">{t("compliance.actions.accessBtn")}</p>
                <p className="text-xs text-fog">Art. 7</p>
              </div>
            </button>

            <button
              onClick={() => { setActiveModal("delete"); setDeleteResult(null); }}
              className="flex items-center gap-3 rounded border border-silk p-4 hover:border-rose/40 hover:bg-rose/5 transition-colors text-left group"
            >
              <div className="rounded-sm bg-rose/10 p-2.5 group-hover:bg-rose/20 transition-colors">
                <Trash2 className="h-4 w-4 text-rose" />
              </div>
              <div>
                <p className="text-sm font-medium text-midnight">{t("compliance.actions.deleteBtn")}</p>
                <p className="text-xs text-fog">Art. 8</p>
              </div>
            </button>

            <button
              onClick={() => { setActiveModal("oppose"); setOpposeResult(null); }}
              className="flex items-center gap-3 rounded border border-silk p-4 hover:border-violet/40 hover:bg-violet/5 transition-colors text-left group"
            >
              <div className="rounded-sm bg-violet/10 p-2.5 group-hover:bg-violet/20 transition-colors">
                <Ban className="h-4 w-4 text-violet" />
              </div>
              <div>
                <p className="text-sm font-medium text-midnight">{t("compliance.actions.opposeBtn")}</p>
                <p className="text-xs text-fog">Art. 9</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataRightsList
          dataRights={dataRights}
          rightsMeta={rightsMeta}
          rightsFilter={rightsFilter}
          setRightsFilter={setRightsFilter}
          rightsStatusFilter={rightsStatusFilter}
          setRightsStatusFilter={setRightsStatusFilter}
          fetchFilteredRights={fetchFilteredRights}
        />
        <AuditLogTable
          auditLogs={auditLogs}
          auditMeta={auditMeta}
          auditActorFilter={auditActorFilter}
          setAuditActorFilter={setAuditActorFilter}
          fetchFilteredAudit={fetchFilteredAudit}
        />
      </div>

      {/* ── Action Modals ── */}
      <ActionModal
        open={activeModal === "access"}
        onClose={() => setActiveModal(null)}
        title={t("compliance.actions.accessBtn")}
        description={t("compliance.actions.accessDesc")}
        icon={Eye}
        iconColor="bg-ocean/10 text-ocean"
        actionLabel={t("compliance.actions.execute")}
        onSubmit={handleAccess}
        loading={actionLoading}
        result={
          accessResult ? (
            <div className="rounded-sm border border-silk bg-snow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-midnight">
                  {accessResult.customer.name ?? "—"}
                </p>
                <Badge variant="default">
                  ****{accessResult.customer.phoneLast4}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-display text-lg font-bold text-midnight">
                    {accessResult.customer.totalOrders}
                  </p>
                  <p className="text-xs text-fog">{t("compliance.actions.totalOrders")}</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-mint-deep">
                    {accessResult.customer.successfulOrders}
                  </p>
                  <p className="text-xs text-fog">{t("compliance.actions.successful")}</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-rose">
                    {accessResult.customer.failedOrders}
                  </p>
                  <p className="text-xs text-fog">{t("compliance.actions.failed")}</p>
                </div>
              </div>
              <p className="text-xs text-mist">
                {accessResult.customer.city} · {t("compliance.actions.since")}{" "}
                {formatDate(accessResult.customer.firstSeen, locale)}
                {accessResult.customer.isOpposed && (
                  <Badge variant="violet" className="ml-2">{t("compliance.actions.opposed")}</Badge>
                )}
              </p>
              {accessResult.orders.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-fog border-b border-silk">
                        <th className="pb-1 text-left font-medium">Ref</th>
                        <th className="pb-1 text-right font-medium">Score</th>
                        <th className="pb-1 text-right font-medium">{t("compliance.actions.decision")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessResult.orders.slice(0, 10).map((o) => (
                        <tr key={o.id} className="border-b border-silk/50">
                          <td className="py-1 text-midnight font-mono">{o.ref || `#${o.id}`}</td>
                          <td className="py-1 text-right">
                            <span className={o.fraudScore >= 66 ? "text-rose" : o.fraudScore >= 31 ? "text-amber" : "text-mint-deep"}>
                              {o.fraudScore}
                            </span>
                          </td>
                          <td className="py-1 text-right text-fog">{o.decision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null
        }
      />

      <ActionModal
        open={activeModal === "delete"}
        onClose={() => setActiveModal(null)}
        title={t("compliance.actions.deleteBtn")}
        description={t("compliance.actions.deleteDesc")}
        icon={Trash2}
        iconColor="bg-rose/10 text-rose"
        actionLabel={t("compliance.actions.deleteConfirm")}
        actionVariant="destructive"
        showReason
        onSubmit={handleDelete}
        loading={actionLoading}
        result={
          deleteResult ? (
            <div className="rounded-sm border border-mint/30 bg-mint/5 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-mint-deep shrink-0" />
              <p className="text-sm text-midnight">
                {t("compliance.actions.deleteResult", { count: deleteResult.ordersAnonymized })}
              </p>
            </div>
          ) : null
        }
      />

      <ActionModal
        open={activeModal === "oppose"}
        onClose={() => setActiveModal(null)}
        title={t("compliance.actions.opposeBtn")}
        description={t("compliance.actions.opposeDesc")}
        icon={Ban}
        iconColor="bg-violet/10 text-violet"
        actionLabel={t("compliance.actions.opposeConfirm")}
        showReason
        onSubmit={handleOppose}
        loading={actionLoading}
        result={
          opposeResult ? (
            <div className="rounded-sm border border-mint/30 bg-mint/5 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-mint-deep shrink-0" />
              <p className="text-sm text-midnight">{opposeResult.message}</p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
