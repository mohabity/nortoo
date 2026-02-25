"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
} from "lucide-react";
import React from "react";

interface AuditLog {
  id: number;
  merchantId: number | null;
  merchantName: string | null;
  userId: number | null;
  userName: string | null;
  actor: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipHash: string | null;
  createdAt: string;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const ACTOR_COLORS: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  system: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  merchant: "bg-green-500/10 text-green-400 border-green-500/30",
  consumer: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

const ACTION_LABELS: Record<string, string> = {
  score: "Scoring",
  override: "Override",
  access_request: "Demande accès",
  delete: "Suppression",
  export: "Export",
  login: "Connexion",
  settings_change: "Paramètres",
  extend_trial: "Extension trial",
  change_plan: "Changement plan",
  deactivate: "Désactivation",
  activate: "Activation",
  coupon_redeem: "Coupon utilisé",
  coupon_create: "Coupon créé",
};

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");

  // Debounce search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  function handleSearchInput(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "30");
      if (actorFilter) params.set("actor", actorFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (search) params.set("search", search);
      if (after) params.set("after", after);
      if (before) params.set("before", before);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();
      setLogs(json.data);
      setMeta(json.meta);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [page, actorFilter, actionFilter, search, after, before, router]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function formatDetails(details: string | null): Record<string, unknown> | null {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-[#C8FF00]" />
          <div>
            <h1 className="text-xl font-display font-bold text-white">
              Journal d&apos;audit
            </h1>
            <p className="text-sm text-fog mt-0.5">
              Historique de toutes les actions (Art. 23 Loi 09-08)
            </p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-mist hover:text-white border border-slate rounded-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Rechercher dans les détails..."
          className="w-full h-10 bg-midnight border border-slate text-white text-sm rounded-sm pl-10 pr-4 placeholder:text-fog/40 focus:outline-none focus:ring-1 focus:ring-[#C8FF00]/40 focus:border-[#C8FF00]/60"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actorFilter}
          onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
          className="bg-midnight border border-slate text-mist text-sm rounded-sm px-3 py-1.5 focus:ring-[#C8FF00]/40 focus:border-[#C8FF00]/60"
        >
          <option value="">Tous les acteurs</option>
          <option value="admin">Admin</option>
          <option value="system">Système</option>
          <option value="merchant">Marchand</option>
          <option value="consumer">Consommateur</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-midnight border border-slate text-mist text-sm rounded-sm px-3 py-1.5 focus:ring-[#C8FF00]/40 focus:border-[#C8FF00]/60"
        >
          <option value="">Toutes les actions</option>
          <option value="score">Scoring</option>
          <option value="override">Override</option>
          <option value="login">Connexion</option>
          <option value="settings_change">Paramètres</option>
          <option value="extend_trial">Extension trial</option>
          <option value="change_plan">Changement plan</option>
          <option value="deactivate">Désactivation</option>
          <option value="activate">Activation</option>
          <option value="coupon_redeem">Coupon utilisé</option>
          <option value="delete">Suppression</option>
          <option value="export">Export</option>
        </select>

        {/* Date range */}
        <input
          type="date"
          value={after}
          onChange={(e) => { setAfter(e.target.value); setPage(1); }}
          title="Après"
          className="bg-midnight border border-slate text-mist text-sm rounded-sm px-2 py-1.5 focus:ring-[#C8FF00]/40 focus:border-[#C8FF00]/60"
        />
        <input
          type="date"
          value={before}
          onChange={(e) => { setBefore(e.target.value); setPage(1); }}
          title="Avant"
          className="bg-midnight border border-slate text-mist text-sm rounded-sm px-2 py-1.5 focus:ring-[#C8FF00]/40 focus:border-[#C8FF00]/60"
        />

        {meta && (
          <span className="text-xs text-fog ml-auto">
            {meta.total} entrées
          </span>
        )}
      </div>

      {/* Table */}
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-[#C8FF00] animate-spin" />
        </div>
      ) : (
        <div className="rounded-sm border border-slate overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate bg-slate/30">
                <th className="w-8 px-2 py-2.5" />
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Acteur
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider hidden md:table-cell">
                  Cible
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider hidden lg:table-cell">
                  Marchand
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedId === log.id;
                const details = formatDetails(log.details);

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="border-b border-slate/50 hover:bg-slate/20 cursor-pointer transition-colors"
                    >
                      <td className="px-2 py-3 text-fog">
                        {details ? (
                          isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-fog text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            ACTOR_COLORS[log.actor] ?? "bg-gray-500/10 text-gray-400 border-gray-500/30"
                          }`}
                        >
                          {log.actor}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-xs font-medium">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </td>
                      <td className="px-4 py-3 text-fog text-xs hidden md:table-cell">
                        {log.targetType ? (
                          <span>
                            {log.targetType}
                            {log.targetId && (
                              <span className="text-mist font-mono"> #{log.targetId}</span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {log.merchantName ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/merchants/${log.merchantId}`);
                            }}
                            className="text-xs text-mist hover:text-[#C8FF00] transition-colors"
                          >
                            {log.merchantName}
                          </button>
                        ) : (
                          <span className="text-fog text-xs">—</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && details && (
                      <tr className="border-b border-slate/50">
                        <td colSpan={6} className="px-6 py-3 bg-slate/10">
                          <pre className="text-xs text-mist font-mono whitespace-pre-wrap break-words max-w-full overflow-x-auto">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                          {log.userName && (
                            <p className="text-xs text-fog mt-2">
                              Utilisateur: {log.userName}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-fog">
                    Aucun log trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-fog">
            Page {meta.page} / {meta.totalPages} ({meta.total} entrées)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 text-mist hover:text-white border border-slate rounded-sm disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
              disabled={page >= meta.totalPages}
              className="p-1.5 text-mist hover:text-white border border-slate rounded-sm disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
