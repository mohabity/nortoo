"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  DollarSign,
  ShoppingCart,
  ShieldAlert,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { PlanBadge, StatusBadge } from "@/components/admin/admin-badges";
import { formatDH } from "@/lib/utils";

interface OverviewData {
  totalMerchants: number;
  trialMerchants: number;
  payingMerchants: number;
  activeMerchants: number;
  mrr: number;
  arr: number;
  orders30d: number;
  blocked30d: number;
  planCounts: Record<string, number>;
  billingCounts: Record<string, number>;
  topMerchants: {
    id: number;
    name: string;
    plan: string;
    billingStatus: string;
    currentMonthOrders: number;
  }[];
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#C8FF00] animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-16">
        <p className="text-rose text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-sm text-[#C8FF00] hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  const blockRate =
    data.orders30d > 0
      ? ((data.blocked30d / data.orders30d) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-white">
            Platform Overview
          </h2>
          <p className="text-sm text-fog mt-0.5">
            {data.totalMerchants} marchands · {data.payingMerchants} payants
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-mist hover:text-white border border-slate rounded-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Total Merchants"
          value={String(data.totalMerchants)}
          subtitle={`${data.trialMerchants} trial · ${data.payingMerchants} payants`}
          icon={Users}
        />
        <AdminKpiCard
          title="MRR"
          value={formatDH(data.mrr)}
          subtitle={`ARR: ${formatDH(data.arr)}`}
          icon={DollarSign}
        />
        <AdminKpiCard
          title="Orders (30j)"
          value={data.orders30d.toLocaleString("fr-FR")}
          subtitle={`${data.blocked30d} bloquées`}
          icon={ShoppingCart}
        />
        <AdminKpiCard
          title="Block Rate (30j)"
          value={`${blockRate}%`}
          subtitle={`${data.blocked30d} / ${data.orders30d} commandes`}
          icon={ShieldAlert}
        />
      </div>

      {/* Top Merchants */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Top Merchants — Ce mois
        </h3>
        <div className="rounded-sm border border-slate overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate bg-slate/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Merchant
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Orders/Month
                </th>
              </tr>
            </thead>
            <tbody>
              {data.topMerchants.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/admin/merchants?selected=${m.id}`)}
                  className="border-b border-slate/50 hover:bg-slate/20 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{m.name}</td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={m.plan} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.billingStatus} />
                  </td>
                  <td className="px-4 py-3 text-right text-mist font-mono">
                    {m.currentMonthOrders.toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
              {data.topMerchants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-fog">
                    Aucun marchand actif
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
