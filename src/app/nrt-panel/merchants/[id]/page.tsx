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
  FileText,
  Download,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
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
import { formatDH, cn } from "@/lib/utils";

interface MerchantInvoice {
  id: number;
  invoiceNumber: string;
  period: string;
  planAtInvoice: string;
  amountTTC: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

const INV_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

const INV_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

function formatInvDH(centimes: number): string {
  const dh = centimes / 100;
  return dh.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
}

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
  pendingPlanDowngrade: string | null;
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
  ship: "text-emerald-600",
  verify: "text-amber",
  flag: "text-orange-500",
  block: "text-rose",
};

export default function AdminMerchantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const merchantId = params.id as string;

  const [data, setData] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [merchantInvoices, setMerchantInvoices] = useState<MerchantInvoice[]>([]);
  const [invoiceActionLoading, setInvoiceActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, invRes] = await Promise.all([
        fetch(`/api/nrt-panel/merchants/${merchantId}`),
        fetch(`/api/nrt-panel/invoices?merchantId=${merchantId}`),
      ]);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/nrt-panel/login");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();
      setData(json.data);

      if (invRes.ok) {
        const invJson = await invRes.json();
        setMerchantInvoices(invJson.data ?? []);
      }
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
      const res = await fetch(`/api/nrt-panel/merchants/${merchantId}/actions`, {
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

  async function handleInvoiceAction(invoiceId: number, status: string) {
    setInvoiceActionLoading(invoiceId);
    try {
      const res = await fetch(`/api/nrt-panel/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Handle silently
    } finally {
      setInvoiceActionLoading(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-mint animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">Marchand introuvable</p>
        <button
          onClick={() => router.push("/nrt-panel/merchants")}
          className="mt-3 text-sm text-mint hover:underline"
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
            onClick={() => router.push("/nrt-panel/merchants")}
            className="mt-1 p-1.5 rounded-sm border border-gray-200 text-gray-500 hover:text-midnight hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-bold text-midnight">
                {merchant.name}
              </h1>
              <PlanBadge plan={merchant.plan} />
              <StatusBadge status={merchant.billingStatus} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
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
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-sm bg-white border border-gray-200 shadow-sm">
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
          className="bg-white border border-gray-200 text-gray-600 text-xs rounded-sm px-2 py-1.5"
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
          <Loader2 className="w-4 h-4 text-mint animate-spin" />
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
        <div className="rounded-sm bg-white border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-midnight mb-4">
            Volume des 6 derniers mois
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#0B0F1A" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="scored"
                  name="Scorées"
                  fill="#00E5A0"
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
        <h3 className="text-sm font-semibold text-midnight mb-3">
          Commandes récentes
        </h3>
        <div className="rounded-sm border border-gray-200 overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ref
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Décision
                </th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livraison
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-midnight font-mono text-xs">
                    {o.externalRef ?? `#${o.id}`}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatDH(o.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-medium text-midnight">
                      {o.fraudScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs font-medium uppercase ${
                        DECISION_COLORS[o.decision] ?? "text-gray-400"
                      }`}
                    >
                      {o.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">
                    {o.deliveryStatus ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
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
        <div className="rounded-sm bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-mint" />
            <h3 className="text-sm font-semibold text-midnight">
              Seuils de scoring
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Verify</span>
              <span className="text-sm font-mono text-amber">
                ≥ {merchant.verifyThreshold}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Flag</span>
              <span className="text-sm font-mono text-orange-500">
                ≥ {merchant.flagThreshold}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Block</span>
              <span className="text-sm font-mono text-rose">
                ≥ {merchant.blockThreshold}
              </span>
            </div>
          </div>
        </div>

        {/* Billing info */}
        <div className="rounded-sm bg-white border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-mint" />
            <h3 className="text-sm font-semibold text-midnight">Billing</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Plan</span>
              <PlanBadge plan={merchant.plan} />
            </div>
            {merchant.pendingPlanDowngrade && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Rétrogradation</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  <ArrowDownCircle className="w-2.5 h-2.5" />
                  {merchant.plan} → {merchant.pendingPlanDowngrade}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <StatusBadge status={merchant.billingStatus} />
            </div>
            {merchant.trialEndsAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Fin trial</span>
                <span className="text-sm text-gray-500">
                  {new Date(merchant.trialEndsAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Inscrit le</span>
              <span className="text-sm text-gray-500">
                {new Date(merchant.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            {merchant.youcanStoreName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Boutique YouCan</span>
                <span className="text-sm text-gray-500">
                  {merchant.youcanStoreName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing / Invoices section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-mint" />
            <h3 className="text-sm font-semibold text-midnight">
              Facturation
            </h3>
            {merchantInvoices.length > 0 && (
              <span className="text-xs text-gray-400">
                ({merchantInvoices.length} facture{merchantInvoices.length > 1 ? "s" : ""})
              </span>
            )}
          </div>
        </div>

        {/* Pending downgrade banner */}
        {merchant.pendingPlanDowngrade && (
          <div className="mb-4 rounded-sm border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <ArrowDownCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Rétrogradation planifiée
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {merchant.plan} → {merchant.pendingPlanDowngrade}
                </p>
                <p className="text-xs text-amber-400 mt-0.5">
                  Effectif au prochain cycle de facturation (le 2 du mois).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending upgrade banner */}
        {(() => {
          const pendingUpgrade = merchantInvoices.find(
            (inv) =>
              inv.status === "pending" &&
              inv.planAtInvoice &&
              inv.planAtInvoice !== merchant.plan
          );
          if (!pendingUpgrade) return null;
          return (
            <div className="mb-4 rounded-sm border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ArrowUpCircle className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-700">
                      Demande d&apos;upgrade en attente
                    </p>
                    <p className="text-xs text-purple-500 mt-0.5">
                      {merchant.plan} → {pendingUpgrade.planAtInvoice} · {formatInvDH(pendingUpgrade.amountTTC)} TTC
                    </p>
                    <p className="text-xs text-purple-400 mt-0.5">
                      Facture {pendingUpgrade.invoiceNumber} · {new Date(pendingUpgrade.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleInvoiceAction(pendingUpgrade.id, "paid")}
                  disabled={invoiceActionLoading === pendingUpgrade.id}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  {invoiceActionLoading === pendingUpgrade.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Confirmer paiement
                </button>
              </div>
            </div>
          );
        })()}

        {/* Invoices table */}
        {merchantInvoices.length > 0 ? (
          <div className="rounded-sm border border-gray-200 overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Facture
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant TTC
                  </th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {merchantInvoices.map((inv) => {
                  const isUpgrade = inv.planAtInvoice && inv.planAtInvoice !== merchant.plan;
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-midnight">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{inv.period}</td>
                      <td className="px-4 py-3">
                        {isUpgrade ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            <ArrowUpCircle className="w-2.5 h-2.5" />
                            {inv.planAtInvoice}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{inv.planAtInvoice}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-midnight text-sm">
                        {formatInvDH(inv.amountTTC)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold", INV_STATUS_STYLES[inv.status])}>
                          {INV_STATUS_LABELS[inv.status] || inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">
                        {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(inv.status === "pending" || inv.status === "overdue") && (
                            <button
                              onClick={() => handleInvoiceAction(inv.id, "paid")}
                              disabled={invoiceActionLoading === inv.id}
                              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              {invoiceActionLoading === inv.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              Payée
                            </button>
                          )}
                          <a
                            href={`/api/nrt-panel/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </a>
                          {inv.status !== "cancelled" && inv.status !== "paid" && (
                            <button
                              onClick={() => handleInvoiceAction(inv.id, "cancelled")}
                              disabled={invoiceActionLoading === inv.id}
                              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-sm border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-400 text-sm">Aucune facture pour ce marchand</p>
          </div>
        )}
      </div>
    </div>
  );
}
