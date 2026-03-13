"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/i18n/provider";
import { useToast } from "@/components/ui/toast";
import type {
  AuditLog,
  DataRightsRequest,
  AccessResult,
  PaginationMeta,
} from "@/app/dashboard/compliance/_components/compliance-config";

export function useComplianceData() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  // Data state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditMeta, setAuditMeta] = useState<PaginationMeta>({ page: 1, totalPages: 1 });
  const [dataRights, setDataRights] = useState<DataRightsRequest[]>([]);
  const [rightsMeta, setRightsMeta] = useState<PaginationMeta>({ page: 1, totalPages: 1 });
  const [oppositionCount, setOppositionCount] = useState(0);
  const [cndpRef, setCndpRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [rightsFilter, setRightsFilter] = useState<string>("all");
  const [rightsStatusFilter, setRightsStatusFilter] = useState<string>("all");
  const [auditActorFilter, setAuditActorFilter] = useState<string>("all");

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

  return {
    // Data
    auditLogs,
    auditTotal,
    auditMeta,
    dataRights,
    rightsMeta,
    oppositionCount,
    cndpRef,
    loading,
    error,

    // Filters
    rightsFilter,
    setRightsFilter,
    rightsStatusFilter,
    setRightsStatusFilter,
    auditActorFilter,
    setAuditActorFilter,

    // Filtered fetches
    fetchFilteredRights,
    fetchFilteredAudit,
    fetchData,

    // Action modals
    activeModal,
    setActiveModal,
    actionLoading,
    accessResult,
    setAccessResult,
    deleteResult,
    setDeleteResult,
    opposeResult,
    setOpposeResult,

    // Action handlers
    handleAccess,
    handleDelete,
    handleOppose,
    copyPublicLink,
  };
}
