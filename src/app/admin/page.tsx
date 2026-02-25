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
  AlertTriangle,
  CalendarPlus,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { PlanBadge, StatusBadge } from "@/components/admin/admin-badges";
import { formatDH } from "@/lib/utils";

interface ActivityItem {
  id: number;
  actor: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string;
}

interface ExpiringTrial {
  id: number;
  name: string;
  email: string;
  trialEndsAt: string;
}

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
  mrrHistory: { month: string; total: number }[];
  recentActivity: ActivityItem[];
  expiringTrials: ExpiringTrial[];
}

const PLAN_COLORS: Record<string, string> = {
  trial: "#94A3B8",
  starter: "#C8FF00",
  pro: "#00E5A0",
  scale: "#3B82F6",
};

const ACTION_LABELS: Record<string, string> = {
  extend_trial: "Extension trial",
  change_plan: "Changement plan",
  deactivate: "Désactivation",
  activate: "Activation",
  score: "Scoring",
  override: "Override",
  login: "Connexion",
  settings_change: "Paramètres",
  coupon_redeem: "Coupon utilisé",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [extendingTrialId, setExtendingTrialId] = useState<number | null>(null);

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

  async function extendTrial(merchantId: number) {
    setExtendingTrialId(merchantId);
    try {
      await fetch(`/api/admin/merchants/${merchantId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_trial", days: 7 }),
      });
      await fetchData();
    } catch {
      // Handle silently
    } finally {
      setExtendingTrialId(null);
    }
  }

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

  // Pie chart data
  const pieData = Object.entries(data.planCounts)
    .filter(([, v]) => v > 0)
    .map(([plan, value]) => ({
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      value,
      fill: PLAN_COLORS[plan] ?? "#94A3B8",
    }));

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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MRR History */}
        <div className="rounded-sm bg-slate/30 border border-slate p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Revenus mensuels (TTC)
          </h3>
          {data.mrrHistory.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.mrrHistory}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                    tickLine={false}
                    tickFormatter={(v) => `${v} DH`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B0F1A",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#E2E8F0" }}
                    formatter={(value: number) => [`${formatDH(value)}`, "Revenus"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#C8FF00"
                    strokeWidth={2}
                    dot={{ fill: "#C8FF00", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-fog text-sm text-center py-8">
              Aucune donnée de revenus
            </p>
          )}
        </div>

        {/* Plan distribution */}
        <div className="rounded-sm bg-slate/30 border border-slate p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Distribution des plans
          </h3>
          {pieData.length > 0 ? (
            <div className="h-56 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B0F1A",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-sm text-mist">{entry.name}</span>
                    <span className="text-sm font-mono text-white ml-auto">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-fog text-sm text-center py-8">
              Aucun marchand
            </p>
          )}
        </div>
      </div>

      {/* Activity + Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent activity */}
        <div className="rounded-sm bg-slate/30 border border-slate p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#C8FF00]" />
            <h3 className="text-sm font-semibold text-white">
              Activité récente
            </h3>
          </div>
          {data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-mist">
                      <span className="text-white font-medium">
                        {ACTION_LABELS[a.action] ?? a.action}
                      </span>
                      {a.targetType && (
                        <span className="text-fog">
                          {" "}
                          sur {a.targetType} #{a.targetId}
                        </span>
                      )}
                    </span>
                    <p className="text-xs text-fog mt-0.5">
                      {a.actor} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-fog text-sm text-center py-4">
              Aucune activité récente
            </p>
          )}
        </div>

        {/* Expiring trials */}
        <div className="rounded-sm bg-slate/30 border border-slate p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber" />
            <h3 className="text-sm font-semibold text-white">
              Trials expirant bientôt
            </h3>
          </div>
          {data.expiringTrials.length > 0 ? (
            <div className="space-y-3">
              {data.expiringTrials.map((m) => {
                const daysLeft = Math.max(
                  0,
                  Math.ceil(
                    (new Date(m.trialEndsAt).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                );
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <button
                        onClick={() => router.push(`/admin/merchants/${m.id}`)}
                        className="text-sm text-white font-medium hover:text-[#C8FF00] transition-colors truncate block"
                      >
                        {m.name}
                      </button>
                      <p className="text-xs text-fog truncate">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-mono font-medium ${
                          daysLeft <= 1 ? "text-rose" : "text-amber"
                        }`}
                      >
                        {daysLeft}j
                      </span>
                      <button
                        onClick={() => extendTrial(m.id)}
                        disabled={extendingTrialId === m.id}
                        title="Extend +7 days"
                        className="p-1 text-amber hover:text-amber/80 transition-colors disabled:opacity-50"
                      >
                        {extendingTrialId === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CalendarPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-fog text-sm text-center py-4">
              Aucun trial en expiration
            </p>
          )}
        </div>
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
                  onClick={() => router.push(`/admin/merchants/${m.id}`)}
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
