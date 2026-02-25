"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  ShieldAlert,
  Calendar,
  TrendingUp,
  CalendarPlus,
  Power,
  PowerOff,
  Globe,
  Mail,
  Settings2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { PlanBadge, StatusBadge } from "@/components/admin/admin-badges";
import { formatDH } from "@/lib/utils";

interface MerchantDetail {
  id: number;
  name: string;
  domain: string | null;
  email: string;
  youcanStoreId: string | null;
  youcanStoreName: string | null;
  plan: string;
  billingStatus: string;
  trialEndsAt: string | null;
  currentMonthOrders: number;
  currentMonthStart: string | null;
  verifyThreshold: number;
  flagThreshold: number;
  blockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: number;
  externalRef: string;
  total: number;
  fraudScore: number;
  decision: string;
  deliveryStatus: string | null;
  createdAt: string;
}

interface Usage {
  month: string;
  ordersScored: number;
  ordersBlocked: number;
  totalValue: number;
  blockedValue: number;
}

interface MerchantData {
  merchant: MerchantDetail;
  recentOrders: Order[];
  usage: Usage[];
  totalOrders: number;
}

const DECISION_COLORS: Record<string, string> = {
  ship: "text-emerald-400",
  verify: "text-amber",
  flag: "text-orange-400",
  block: "text-rose",
};

export default function AdminMerchantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const merchantId = params.id as string;

  const [data, setData] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`);
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
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [merchantId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function executeAction(
    action: string,
    payload: Record<string, unknown> = {}
  ) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Handle silently
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#C8FF00] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-fog text-sm">Marchand introuvable</p>
        <button
          onClick={() => router.push("/admin/merchants")}
          className="mt-3 text-sm text-[#C8FF00] hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const { merchant, recentOrders, usage, totalOrders } = data;

  // Compute KPIs
  const blockedOrders = recentOrders.filter((o) => o.decision === "block").length;
  const blockRate =
    recentOrders.length > 0
      ? ((blockedOrders / recentOrders.length) * 100).toFixed(1)
      : "0";

  const trialDaysLeft =
    merchant.trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(merchant.trialEndsAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  // Chart data (reverse to show oldest first)
  const chartData = [...usage].reverse().map((u) => ({
    month: u.month,
    scored: u.ordersScored,
    blocked: u.ordersBlocked,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/admin/merchants")}
            className="mt-1 p-1.5 rounded-sm border border-slate text-mist hover:text-white hover:bg-slate/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-bold text-white">
                {merchant.name}
              </h1>
              <PlanBadge plan={merchant.plan} />
              <StatusBadge status={merchant.billingStatus} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-fog">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {merchant.email}
              </span>
              {merchant.domain && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {merchant.domain}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-sm bg-slate/30 border border-slate">
        {/* Change plan */}
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              executeAction("change_plan", { plan: e.target.value });
              e.target.value = "";
            }
          }}
          disabled={actionLoading}
          className="bg-midnight border border-slate text-mist text-xs rounded-sm px-2 py-1.5"
        >
          <option value="">Changer plan...</option>
          {["trial", "starter", "pro", "scale"]
            .filter((p) => p !== merchant.plan)
            .map((p) => (
              <option key={p} value={p}>
                → {p}
              </option>
            ))}
        </select>

        {/* Extend trial */}
        {(merchant.billingStatus === "trial" || merchant.plan === "trial") && (
          <>
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => executeAction("extend_trial", { days })}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber border border-amber/30 rounded-sm hover:bg-amber/10 disabled:opacity-50 transition-colors"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                +{days}j
              </button>
            ))}
          </>
        )}

        {/* Activate / Deactivate */}
        {merchant.billingStatus === "cancelled" ? (
          <button
            onClick={() => executeAction("activate")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mint border border-mint/30 rounded-sm hover:bg-mint/10 disabled:opacity-50 transition-colors"
          >
            <Power className="w-3.5 h-3.5" />
            Activer
          </button>
        ) : merchant.billingStatus !== "trial" ? (
          <button
            onClick={() => executeAction("deactivate")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose border border-rose/30 rounded-sm hover:bg-rose/10 disabled:opacity-50 transition-colors"
          >
            <PowerOff className="w-3.5 h-3.5" />
            Désactiver
          </button>
        ) : null}

        {actionLoading && (
          <Loader2 className="w-4 h-4 text-[#C8FF00] animate-spin" />
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          title="Total Orders"
          value={totalOrders.toLocaleString("fr-FR")}
          subtitle={`${merchant.currentMonthOrders} ce mois`}
          icon={ShoppingCart}
        />
        <AdminKpiCard
          title="Orders/Mois"
          value={merchant.currentMonthOrders.toLocaleString("fr-FR")}
          subtitle="Période en cours"
          icon={TrendingUp}
        />
        <AdminKpiCard
          title="Block Rate"
          value={`${blockRate}%`}
          subtitle={`${blockedOrders}/${recentOrders.length} récentes`}
          icon={ShieldAlert}
        />
        <AdminKpiCard
          title={merchant.billingStatus === "trial" ? "Trial restant" : "Membre depuis"}
          value={
            merchant.billingStatus === "trial" && trialDaysLeft !== null
              ? `${trialDaysLeft}j`
              : new Date(merchant.createdAt).toLocaleDateString("fr-FR")
          }
          subtitle={
            merchant.trialEndsAt
              ? `Fin: ${new Date(merchant.trialEndsAt).toLocaleDateString("fr-FR")}`
              : undefined
          }
          icon={Calendar}
        />
      </div>

      {/* Usage chart */}
      {chartData.length > 0 && (
        <div className="rounded-sm bg-slate/30 border border-slate p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Volume des 6 derniers mois
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B0F1A",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#E2E8F0" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="scored"
                  name="Scorées"
                  fill="#C8FF00"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="blocked"
                  name="Bloquées"
                  fill="#F43F5E"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Commandes récentes
        </h3>
        <div className="rounded-sm border border-slate overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate bg-slate/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Ref
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Montant
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Score
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Décision
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Livraison
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-mist uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-slate/50 hover:bg-slate/20 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-mono text-xs">
                    {o.externalRef ?? `#${o.id}`}
                  </td>
                  <td className="px-4 py-3 text-right text-mist">
                    {formatDH(o.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-medium text-white">
                      {o.fraudScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs font-medium uppercase ${
                        DECISION_COLORS[o.decision] ?? "text-fog"
                      }`}
                    >
                      {o.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-fog text-xs">
                    {o.deliveryStatus ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-fog text-xs">
                    {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-fog">
                    Aucune commande
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scoring thresholds */}
        <div className="rounded-sm bg-slate/30 border border-slate p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-[#C8FF00]" />
            <h3 className="text-sm font-semibold text-white">
              Seuils de scoring
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-fog">Verify</span>
              <span className="text-sm font-mono text-amber">
                ≥ {merchant.verifyThreshold}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fog">Flag</span>
              <span className="text-sm font-mono text-orange-400">
                ≥ {merchant.flagThreshold}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fog">Block</span>
              <span className="text-sm font-mono text-rose">
                ≥ {merchant.blockThreshold}
              </span>
            </div>
          </div>
        </div>

        {/* Billing info */}
        <div className="rounded-sm bg-slate/30 border border-slate p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[#C8FF00]" />
            <h3 className="text-sm font-semibold text-white">Billing</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-fog">Plan</span>
              <PlanBadge plan={merchant.plan} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-fog">Status</span>
              <StatusBadge status={merchant.billingStatus} />
            </div>
            {merchant.trialEndsAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-fog">Fin trial</span>
                <span className="text-sm text-mist">
                  {new Date(merchant.trialEndsAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-fog">Inscrit le</span>
              <span className="text-sm text-mist">
                {new Date(merchant.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            {merchant.youcanStoreName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-fog">Boutique YouCan</span>
                <span className="text-sm text-mist">
                  {merchant.youcanStoreName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
