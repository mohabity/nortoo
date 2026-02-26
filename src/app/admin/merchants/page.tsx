"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarPlus,
  Power,
  PowerOff,
  Search,
  Download,
} from "lucide-react";
import { PlanBadge, StatusBadge } from "@/components/admin/admin-badges";
import { getOrderLimit } from "@/lib/plans";

interface Merchant {
  id: number;
  name: string;
  email: string;
  plan: string;
  billingStatus: string;
  currentMonthOrders: number;
  trialEndsAt: string | null;
  createdAt: string;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function AdminMerchantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-mint animate-spin" />
        </div>
      }
    >
      <MerchantsContent />
    </Suspense>
  );
}

function MerchantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filters
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10)
  );
  const [planFilter, setPlanFilter] = useState(
    searchParams.get("plan") ?? ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") ?? ""
  );
  const [sort, setSort] = useState(
    searchParams.get("sort") ?? "created_desc"
  );
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");

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

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "20");
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      if (createdAfter) params.set("created_after", createdAfter);
      if (createdBefore) params.set("created_before", createdBefore);
      params.set("sort", sort);

      const res = await fetch(`/api/admin/merchants?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();
      setMerchants(json.data);
      setMeta(json.meta);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [page, planFilter, statusFilter, sort, search, createdAfter, createdBefore, router]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  // CSV Export
  async function handleExport() {
    const params = new URLSearchParams();
    if (planFilter) params.set("plan", planFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (createdAfter) params.set("created_after", createdAfter);
    if (createdBefore) params.set("created_before", createdBefore);
    params.set("sort", sort);

    const res = await fetch(`/api/admin/merchants/export?${params}`);
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merchants-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Actions
  async function executeAction(
    merchantId: number,
    action: string,
    payload: Record<string, unknown> = {}
  ) {
    setActionLoading(merchantId);
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        await fetchMerchants();
      }
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  }

  function quotaPercent(m: Merchant): string {
    const limit = getOrderLimit(m.plan);
    if (limit === 0) return "\u221E";
    return `${Math.min(Math.round((m.currentMonthOrders / limit) * 100), 100)}%`;
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full h-10 bg-white border border-gray-200 text-midnight text-sm rounded-sm pl-10 pr-4 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-mint/40 focus:border-mint/60"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 text-gray-600 text-sm rounded-sm px-3 py-1.5 focus:ring-mint/40 focus:border-mint/60"
        >
          <option value="">All Plans</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="scale">Scale</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 text-gray-600 text-sm rounded-sm px-3 py-1.5 focus:ring-mint/40 focus:border-mint/60"
        >
          <option value="">All Statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-white border border-gray-200 text-gray-600 text-sm rounded-sm px-3 py-1.5 focus:ring-mint/40 focus:border-mint/60"
        >
          <option value="created_desc">Newest First</option>
          <option value="created_asc">Oldest First</option>
          <option value="orders_desc">Most Orders</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>

        {/* Date filters */}
        <input
          type="date"
          value={createdAfter}
          onChange={(e) => { setCreatedAfter(e.target.value); setPage(1); }}
          title="Créé après"
          className="bg-white border border-gray-200 text-gray-600 text-sm rounded-sm px-2 py-1.5 focus:ring-mint/40 focus:border-mint/60"
        />
        <input
          type="date"
          value={createdBefore}
          onChange={(e) => { setCreatedBefore(e.target.value); setPage(1); }}
          title="Créé avant"
          className="bg-white border border-gray-200 text-gray-600 text-sm rounded-sm px-2 py-1.5 focus:ring-mint/40 focus:border-mint/60"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExport}
            title="Exporter CSV"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-midnight border border-gray-200 rounded-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={fetchMerchants}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-midnight border border-gray-200 rounded-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading && merchants.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-mint animate-spin" />
        </div>
      ) : (
        <div className="rounded-sm border border-gray-200 overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Quota
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Created
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/admin/merchants/${m.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-midnight font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{m.email}</td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={m.plan} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.billingStatus} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 font-mono">
                    {m.currentMonthOrders.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 font-mono hidden lg:table-cell">
                    {quotaPercent(m)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 hidden lg:table-cell">
                    {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Change plan dropdown */}
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            executeAction(m.id, "change_plan", { plan: e.target.value });
                            e.target.value = "";
                          }
                        }}
                        disabled={actionLoading === m.id}
                        className="bg-white border border-gray-200 text-gray-600 text-xs rounded-xs px-1.5 py-1 w-20"
                      >
                        <option value="">Plan...</option>
                        {["trial", "starter", "pro", "scale"]
                          .filter((p) => p !== m.plan)
                          .map((p) => (
                            <option key={p} value={p}>
                              &rarr; {p}
                            </option>
                          ))}
                      </select>

                      {/* Extend trial +7d */}
                      {(m.billingStatus === "trial" || m.plan === "trial") && (
                        <button
                          onClick={() => executeAction(m.id, "extend_trial", { days: 7 })}
                          disabled={actionLoading === m.id}
                          title="Extend trial +7 days"
                          className="p-1 text-amber hover:text-amber/80 transition-colors disabled:opacity-50"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Activate / Deactivate */}
                      {m.billingStatus === "cancelled" ? (
                        <button
                          onClick={() => executeAction(m.id, "activate")}
                          disabled={actionLoading === m.id}
                          title="Activate"
                          className="p-1 text-mint hover:text-mint/80 transition-colors disabled:opacity-50"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      ) : m.billingStatus !== "trial" ? (
                        <button
                          onClick={() => executeAction(m.id, "deactivate")}
                          disabled={actionLoading === m.id}
                          title="Deactivate"
                          className="p-1 text-rose hover:text-rose/80 transition-colors disabled:opacity-50"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      {/* Loading indicator */}
                      {actionLoading === m.id && (
                        <Loader2 className="w-3.5 h-3.5 text-mint animate-spin" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {merchants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Aucun marchand trouvé
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
          <p className="text-xs text-gray-400">
            Page {meta.page} / {meta.totalPages} ({meta.total} marchands)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 text-gray-500 hover:text-midnight border border-gray-200 rounded-sm disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
              disabled={page >= meta.totalPages}
              className="p-1.5 text-gray-500 hover:text-midnight border border-gray-200 rounded-sm disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
