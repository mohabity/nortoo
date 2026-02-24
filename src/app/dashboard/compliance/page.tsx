"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  FileText,
  Eye,
  Trash2,
  Ban,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  LogIn,
  Download,
  RefreshCw,
  Settings,
  X,
  Phone,
} from "lucide-react";
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
import { useToast } from "@/components/ui/toast";

// ── Types ──

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

interface AccessResult {
  customer: {
    phoneLast4: string;
    name: string;
    city: string;
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    isOpposed: boolean;
    firstSeen: string;
    lastSeen: string;
  };
  orders: Array<{
    id: number;
    ref: string;
    total: number;
    currency: string;
    city: string;
    fraudScore: number;
    decision: string;
    createdAt: string;
  }>;
}

// ── Config maps ──

const rightTypeConfig: Record<
  string,
  { key: string; icon: typeof Eye; variant: "ocean" | "rose" | "violet" }
> = {
  access: { key: "compliance.rights.access", icon: Eye, variant: "ocean" },
  deletion: { key: "compliance.rights.deletion", icon: Trash2, variant: "rose" },
  opposition: { key: "compliance.rights.objection", icon: Ban, variant: "violet" },
};

const statusConfig: Record<
  string,
  { key: string; variant: "mint" | "amber" | "default" | "rose" }
> = {
  pending: { key: "compliance.rights.statusPending", variant: "amber" },
  processing: { key: "compliance.rights.statusInProgress", variant: "amber" },
  completed: { key: "compliance.rights.statusProcessed", variant: "mint" },
  refused: { key: "compliance.rights.statusRejected", variant: "rose" },
};

const actionConfig: Record<string, { key: string; icon: typeof Shield }> = {
  score: { key: "compliance.audit.scoring", icon: Shield },
  override: { key: "compliance.audit.override", icon: RefreshCw },
  access_request: { key: "compliance.audit.accessRequest", icon: Eye },
  data_rights_access: { key: "compliance.audit.accessRequest", icon: Eye },
  data_rights_delete: { key: "compliance.audit.deletion", icon: Trash2 },
  data_rights_oppose: { key: "compliance.audit.objection", icon: Ban },
  delete: { key: "compliance.audit.deletion", icon: Trash2 },
  data_purge: { key: "compliance.audit.deletion", icon: Trash2 },
  settings_change: { key: "compliance.audit.settings", icon: Settings },
  login: { key: "compliance.audit.login", icon: LogIn },
  export: { key: "compliance.audit.export", icon: Download },
  analytics_exported: { key: "compliance.audit.export", icon: Download },
  report_exported: { key: "compliance.audit.export", icon: Download },
};

const actorKeys: Record<string, string> = {
  system: "compliance.audit.system",
  merchant: "compliance.audit.merchant",
  consumer: "compliance.audit.consumer",
  admin: "compliance.audit.admin",
};

// ── Action Modal Component ──

function ActionModal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  iconColor,
  actionLabel,
  actionVariant = "default",
  showReason = false,
  onSubmit,
  result,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: typeof Eye;
  iconColor: string;
  actionLabel: string;
  actionVariant?: "default" | "destructive";
  showReason?: boolean;
  onSubmit: (phone: string, reason?: string) => void;
  result: React.ReactNode | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded bg-white shadow-xl border border-silk max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-silk">
          <div className="flex items-center gap-3">
            <div className={`rounded-sm p-2 ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-midnight">{title}</h3>
              <p className="text-xs text-fog">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-fog hover:text-midnight">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-fog mb-1.5 block">
              {t("compliance.actions.phoneLabel")}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("compliance.actions.phonePlaceholder")}
                className="w-full rounded-sm border border-silk bg-snow pl-10 pr-4 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
              />
            </div>
          </div>
          {showReason && (
            <div>
              <label className="text-xs font-medium text-fog mb-1.5 block">
                {t("compliance.actions.reasonLabel")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("compliance.actions.reasonPlaceholder")}
                rows={2}
                className="w-full rounded-sm border border-silk bg-snow px-4 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint resize-none"
              />
            </div>
          )}
          <Button
            onClick={() => onSubmit(phone, reason)}
            disabled={!phone.trim() || loading}
            className={`w-full ${actionVariant === "destructive" ? "bg-rose hover:bg-rose/90 text-white" : ""}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {actionLabel}
          </Button>
          {result && <div className="mt-2">{result}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function CompliancePage() {
  const { t, locale } = useTranslation();
  const { addToast } = useToast();

  // Data state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditMeta, setAuditMeta] = useState({ page: 1, totalPages: 1 });
  const [dataRights, setDataRights] = useState<DataRightsRequest[]>([]);
  const [rightsMeta, setRightsMeta] = useState({ page: 1, totalPages: 1 });
  const [oppositionCount, setOppositionCount] = useState(0);
  const [cndpRef, setCndpRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [rightsFilter, setRightsFilter] = useState<string>("all");
  const [rightsStatusFilter, setRightsStatusFilter] = useState<string>("all");
  const [auditActorFilter, setAuditActorFilter] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Action modals
  const [activeModal, setActiveModal] = useState<"access" | "delete" | "oppose" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [accessResult, setAccessResult] = useState<AccessResult | null>(null);
  const [deleteResult, setDeleteResult] = useState<{ ordersAnonymized: number } | null>(null);
  const [opposeResult, setOpposeResult] = useState<{ message: string } | null>(null);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [auditRes, rightsRes, oppositionRes, settingsRes] = await Promise.all([
        fetch("/api/dashboard/audit?per_page=10"),
        fetch("/api/data-rights/list?per_page=10"),
        fetch("/api/data-rights/list?right_type=opposition&per_page=1"),
        fetch("/api/settings"),
      ]);

      if (auditRes.ok) {
        const json = await auditRes.json();
        setAuditLogs(json.data ?? []);
        setAuditTotal(json.meta?.total ?? 0);
        setAuditMeta({ page: json.meta?.page ?? 1, totalPages: json.meta?.totalPages ?? 1 });
      }
      if (rightsRes.ok) {
        const json = await rightsRes.json();
        setDataRights(json.data ?? []);
        setRightsMeta({ page: json.meta?.page ?? 1, totalPages: json.meta?.totalPages ?? 1 });
      }
      if (oppositionRes.ok) {
        const json = await oppositionRes.json();
        setOppositionCount(json.meta?.total ?? 0);
      }
      if (settingsRes.ok) {
        const json = await settingsRes.json();
        setCndpRef(json.data?.cndpDeclarationRef ?? null);
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ── Filtered fetches ──
  const fetchFilteredRights = useCallback(async (page = 1) => {
    const params = new URLSearchParams({ per_page: "10", page: String(page) });
    if (rightsFilter !== "all") params.set("right_type", rightsFilter);
    if (rightsStatusFilter !== "all") params.set("status", rightsStatusFilter);
    const res = await fetch(`/api/data-rights/list?${params}`);
    if (res.ok) {
      const json = await res.json();
      setDataRights(json.data ?? []);
      setRightsMeta({ page: json.meta?.page ?? 1, totalPages: json.meta?.totalPages ?? 1 });
    }
  }, [rightsFilter, rightsStatusFilter]);

  const fetchFilteredAudit = useCallback(async (page = 1) => {
    const params = new URLSearchParams({ per_page: "10", page: String(page) });
    if (auditActorFilter !== "all") params.set("actor", auditActorFilter);
    const res = await fetch(`/api/dashboard/audit?${params}`);
    if (res.ok) {
      const json = await res.json();
      setAuditLogs(json.data ?? []);
      setAuditTotal(json.meta?.total ?? 0);
      setAuditMeta({ page: json.meta?.page ?? 1, totalPages: json.meta?.totalPages ?? 1 });
    }
  }, [auditActorFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (!loading) fetchFilteredRights(); }, [rightsFilter, rightsStatusFilter, fetchFilteredRights, loading]);
  useEffect(() => { if (!loading) fetchFilteredAudit(); }, [auditActorFilter, fetchFilteredAudit, loading]);

  // ── Action handlers ──
  const handleAccess = async (phone: string) => {
    setActionLoading(true);
    setAccessResult(null);
    try {
      const res = await fetch("/api/data-rights/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (res.ok) {
        setAccessResult(json.data);
        fetchData();
      } else {
        addToast({ type: "error", message: json.error || t("common.error") });
      }
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (phone: string, reason?: string) => {
    setActionLoading(true);
    setDeleteResult(null);
    try {
      const res = await fetch("/api/data-rights/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, reason }),
      });
      const json = await res.json();
      if (res.ok) {
        setDeleteResult(json.data);
        addToast({ type: "success", message: t("compliance.actions.deleteSuccess") });
        fetchData();
      } else {
        addToast({ type: "error", message: json.error || t("common.error") });
      }
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOppose = async (phone: string, reason?: string) => {
    setActionLoading(true);
    setOpposeResult(null);
    try {
      const res = await fetch("/api/data-rights/oppose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, reason }),
      });
      const json = await res.json();
      if (res.ok) {
        setOpposeResult(json.data);
        addToast({ type: "success", message: t("compliance.actions.opposeSuccess") });
        fetchData();
      } else {
        addToast({ type: "error", message: json.error || t("common.error") });
      }
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setActionLoading(false);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/data-rights`;
    navigator.clipboard.writeText(url);
    addToast({ type: "success", message: t("common.copied") });
  };

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

  // ── Helpers ──
  const isDeadlineClose = (deadline: string | null) => {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 5 * 24 * 60 * 60 * 1000;
  };
  const isDeadlinePast = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

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
      {!cndpRef ? (
        <div className="flex items-center gap-3 rounded border border-amber/30 bg-amber/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-midnight">{t("compliance.cndp.required")}</p>
            <p className="text-xs text-fog">{t("compliance.cndp.requiredDesc")}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded border border-mint/30 bg-mint/5 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-mint-deep shrink-0" />
          <p className="text-sm text-midnight">
            <span className="font-medium">{t("compliance.cndp.ref")}</span>{" "}
            <span className="font-mono text-mint-deep">{cndpRef}</span>
          </p>
        </div>
      )}

      {/* KPI Cards */}
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
        {/* Data Rights Requests */}
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

        {/* Audit Log */}
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
