"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Ticket,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import { formatDH } from "@/lib/utils";

interface AdminTicket {
  id: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  merchantId: number;
  merchantName: string | null;
  merchantEmail: string | null;
}

interface Meta {
  page: number;
  totalPages: number;
  total: number;
}

const STATUS_OPTIONS = ["", "open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["", "low", "normal", "high"];

const statusStyles: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};

const priorityStyles: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/nrt-panel/tickets?${params}`);
      if (res.status === 401) {
        router.push("/nrt-panel/login");
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data ?? []);
        setMeta(json.meta ?? { page: 1, totalPages: 1, total: 0 });
      }
      setLoading(false);
    },
    [statusFilter, priorityFilter, search, router]
  );

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(true);
    const res = await fetch(`/api/nrt-panel/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchTickets(meta.page);
      setSelectedTicket(null);
    }
    setUpdating(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-mint" />
            Tickets Support
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta.total} ticket{meta.total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={() => fetchTickets(meta.page)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mint/30"
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouvert</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolu</option>
          <option value="closed">Fermé</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-mint/30"
        >
          <option value="">Toutes priorités</option>
          <option value="low">Basse</option>
          <option value="normal">Normale</option>
          <option value="high">Haute</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aucun ticket
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  #
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Sujet
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Marchand
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Priorité
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Statut
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[250px] truncate">
                    {t.subject}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{t.merchantName ?? "—"}</div>
                    <div className="text-xs text-gray-400">
                      {t.merchantEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {t.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        priorityStyles[t.priority] ?? ""
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        statusStyles[t.status] ?? ""
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => fetchTickets(p)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  meta.page === p
                    ? "bg-mint text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    #{selectedTicket.id} ·{" "}
                    {formatDate(selectedTicket.createdAt)}
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedTicket.subject}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    statusStyles[selectedTicket.status] ?? ""
                  }`}
                >
                  {selectedTicket.status.replace("_", " ")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    priorityStyles[selectedTicket.priority] ?? ""
                  }`}
                >
                  {selectedTicket.priority}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {selectedTicket.category}
                </span>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">
                  {selectedTicket.merchantName}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedTicket.merchantEmail}
                </p>
              </div>

              <div className="p-4 rounded-md bg-gray-50 border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Status actions */}
              <div className="flex gap-2 flex-wrap">
                {selectedTicket.status !== "in_progress" && (
                  <button
                    onClick={() =>
                      updateStatus(selectedTicket.id, "in_progress")
                    }
                    disabled={updating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    En cours
                  </button>
                )}
                {selectedTicket.status !== "resolved" && (
                  <button
                    onClick={() =>
                      updateStatus(selectedTicket.id, "resolved")
                    }
                    disabled={updating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Résolu
                  </button>
                )}
                {selectedTicket.status !== "closed" && (
                  <button
                    onClick={() =>
                      updateStatus(selectedTicket.id, "closed")
                    }
                    disabled={updating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Fermer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
