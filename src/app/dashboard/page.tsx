"use client";

import {
  ShoppingCart,
  TrendingUp,
  Truck,
  ShieldAlert,
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
import { OrderCard } from "@/components/dashboard/order-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ── Mock chart data ──
const chartData = [
  { date: "01 Fév", commandes: 24, score: 38 },
  { date: "02 Fév", commandes: 31, score: 42 },
  { date: "03 Fév", commandes: 18, score: 35 },
  { date: "04 Fév", commandes: 45, score: 48 },
  { date: "05 Fév", commandes: 38, score: 41 },
  { date: "06 Fév", commandes: 52, score: 44 },
  { date: "07 Fév", commandes: 41, score: 39 },
  { date: "08 Fév", commandes: 35, score: 36 },
  { date: "09 Fév", commandes: 48, score: 43 },
  { date: "10 Fév", commandes: 55, score: 47 },
  { date: "11 Fév", commandes: 42, score: 40 },
  { date: "12 Fév", commandes: 38, score: 37 },
  { date: "13 Fév", commandes: 61, score: 45 },
  { date: "14 Fév", commandes: 58, score: 42 },
];

// ── Mock recent orders ──
const recentOrders: OrderRow[] = [
  {
    id: 1,
    externalRef: "#1847",
    customerName: "Ahmed Benali",
    customerPhoneLast4: "3456",
    productName: "T-shirt Nike Dri-FIT",
    total: 349,
    shippingCity: "Casablanca",
    fraudScore: 15,
    decision: "ship",
    deliveryStatus: "shipped",
    pipelineStatus: "auto_shipped",
    createdAt: "2026-02-18T10:30:00Z",
  },
  {
    id: 2,
    externalRef: "#1848",
    customerName: "Fatima Zahra Idrissi",
    customerPhoneLast4: "7821",
    productName: "Robe Caftan",
    total: 890,
    shippingCity: "Rabat",
    fraudScore: 35,
    decision: "verify",
    deliveryStatus: "pending",
    pipelineStatus: "needs_review",
    createdAt: "2026-02-18T09:15:00Z",
  },
  {
    id: 3,
    externalRef: "#1849",
    customerName: "Youssef El Amrani",
    customerPhoneLast4: "1234",
    productName: "Montre Casio G-Shock",
    total: 1250,
    shippingCity: "Taza",
    fraudScore: 75,
    decision: "flag",
    deliveryStatus: "pending",
    pipelineStatus: "escalated",
    createdAt: "2026-02-18T08:45:00Z",
  },
  {
    id: 4,
    externalRef: "#1850",
    customerName: "Karim Tazi",
    customerPhoneLast4: "9012",
    productName: "Baskets Puma RS-X",
    total: 680,
    shippingCity: "Marrakech",
    fraudScore: 25,
    decision: "ship",
    deliveryStatus: "delivered",
    pipelineStatus: "auto_shipped",
    createdAt: "2026-02-18T07:20:00Z",
  },
  {
    id: 5,
    externalRef: "#1851",
    customerName: "xxxx",
    customerPhoneLast4: "5678",
    productName: "iPhone 15 Coque + Écouteurs",
    total: 1850,
    shippingCity: "Sidi Slimane",
    fraudScore: 92,
    decision: "block",
    deliveryStatus: "cancelled",
    pipelineStatus: "auto_blocked",
    createdAt: "2026-02-18T03:12:00Z",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-fog">
          Résumé de votre activité anti-fraude
        </p>
      </div>

      {/* KPI Cards — horizontal scroll mobile, grid desktop */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-4">
        <div className="min-w-[240px] snap-start lg:min-w-0">
          <KpiCard
            title="Commandes aujourd'hui"
            value="58"
            change="+12% vs hier"
            changeType="positive"
            icon={ShoppingCart}
            iconColor="text-ocean"
          />
        </div>
        <div className="min-w-[240px] snap-start lg:min-w-0">
          <KpiCard
            title="Score moyen"
            value="38"
            change="-3 pts vs semaine passée"
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-mint"
          />
        </div>
        <div className="min-w-[240px] snap-start lg:min-w-0">
          <KpiCard
            title="Taux de livraison"
            value="78%"
            change="+5% ce mois"
            changeType="positive"
            icon={Truck}
            iconColor="text-mint"
          />
        </div>
        <div className="min-w-[240px] snap-start lg:min-w-0">
          <KpiCard
            title="Bloquées"
            value="4"
            change="6.9% du total"
            changeType="neutral"
            icon={ShieldAlert}
            iconColor="text-violet"
          />
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tendance des commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="commandes"
                  stroke="#00E5A0"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCommandes)"
                  name="Commandes"
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Score moyen"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop: table */}
          <div className="hidden lg:block">
            <OrderTable orders={recentOrders} />
          </div>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-2 lg:hidden">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
