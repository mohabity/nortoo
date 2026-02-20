"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Truck,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OrderTable, type OrderRow } from "@/components/dashboard/order-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConnectStoreBanner } from "@/components/dashboard/connect-store-banner";

// ── Types ──
interface Stats {
  ordersToday: number;
  ordersTodayChange: string;
  avgScore: number;
  deliveryRate: number;
  blockedCount: number;
  totalOrders: number;
}

interface ChartPoint {
  date: string;
  commandes: number;
  score: number;
}

export default function DashboardPage() {
  const [isStoreConnected, setIsStoreConnected] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If ?connected=true in URL, store was just connected via OAuth
    const params = new URLSearchParams(window.location.search);
    const justConnected = params.get("connected") === "true";

    async function fetchData() {
      try {
        const [settingsRes, statsRes, chartRes, ordersRes] = await Promise.all([
          justConnected ? null : fetch("/api/settings").then((r) => r.json()).catch(() => null),
          fetch("/api/stats").then((r) => r.json()),
          fetch("/api/chart").then((r) => r.json()),
          fetch("/api/orders?per_page=5").then((r) => r.json()),
        ]);

        // Banner: store connection status
        if (justConnected) {
          setIsStoreConnected(true);
        } else {
          setIsStoreConnected(!!settingsRes?.data?.youcanStoreId);
        }

        // KPIs
        if (statsRes?.data) {
          setStats(statsRes.data);
        }

        // Chart
        if (chartRes?.data) {
          setChartData(chartRes.data);
        }

        // Recent orders
        if (ordersRes?.data) {
          setRecentOrders(ordersRes.data);
        }
      } catch {
        // Fail silently — show empty state
        setIsStoreConnected(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-sora text-2xl font-bold text-ink-1">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-ink-3">
          Résumé de votre activité anti-fraude
        </p>
      </div>

      {/* Connect store banner */}
      {isStoreConnected !== null && (
        <ConnectStoreBanner isStoreConnected={isStoreConnected} />
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-sun" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Commandes aujourd'hui"
              value={String(stats?.ordersToday ?? 0)}
              change={stats?.ordersTodayChange || undefined}
              changeType={
                stats?.ordersTodayChange?.startsWith("+")
                  ? "positive"
                  : stats?.ordersTodayChange?.startsWith("-")
                    ? "negative"
                    : "neutral"
              }
              icon={ShoppingCart}
              iconColor="text-ocean"
            />
            <KpiCard
              title="Score moyen"
              value={String(stats?.avgScore ?? 0)}
              change={`sur ${stats?.totalOrders ?? 0} commandes`}
              changeType="neutral"
              icon={TrendingUp}
              iconColor="text-sun"
            />
            <KpiCard
              title="Taux de livraison"
              value={`${stats?.deliveryRate ?? 0}%`}
              changeType="neutral"
              icon={Truck}
              iconColor="text-mint"
            />
            <KpiCard
              title="Bloquées aujourd'hui"
              value={String(stats?.blockedCount ?? 0)}
              changeType="neutral"
              icon={ShieldAlert}
              iconColor="text-violet"
            />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Tendance des commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {chartData.some((d) => d.commandes > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D8" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#78716C" }}
                        axisLine={{ stroke: "#E7E0D8" }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#78716C" }}
                        axisLine={{ stroke: "#E7E0D8" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #E7E0D8",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="commandes"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCommandes)"
                        name="Commandes"
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#0EA5E9"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        name="Score moyen"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-ink-4">
                      Aucune donnée sur les 14 derniers jours
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <OrderTable orders={recentOrders} />
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-ink-4">
                    Aucune commande pour le moment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
