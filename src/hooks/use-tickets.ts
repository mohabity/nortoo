"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/i18n/provider";

export interface SupportTicket {
  id: number;
  merchantId: number;
  userId: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketMeta {
  page: number;
  totalPages: number;
  total: number;
}

interface CreateTicketData {
  subject: string;
  description: string;
  category: string;
  priority: string;
}

export function useTickets() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [meta, setMeta] = useState<TicketMeta>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTickets = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/support/tickets?${params}`);
        if (res.ok) {
          const json = await res.json();
          setTickets(json.data ?? []);
          setMeta(json.meta ?? { page: 1, totalPages: 1, total: 0 });
        } else {
          setError(t("common.error"));
        }
      } catch {
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, t]
  );

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const createTicket = useCallback(
    async (data: CreateTicketData) => {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? t("support.form.error"));
      }
      // Refresh list
      await fetchTickets(1);
      return res.json();
    },
    [fetchTickets, t]
  );

  const closeTicket = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? t("common.error"));
      }
      await fetchTickets(meta.page);
      return res.json();
    },
    [fetchTickets, meta.page, t]
  );

  return {
    tickets,
    meta,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    fetchTickets,
    createTicket,
    closeTicket,
  };
}
