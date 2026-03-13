"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Coins,
  TrendingUp,
  Truck,
  ShieldAlert,
  Timer,
  X,
  RefreshCw,
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
import { OrderCard } from "@/components/dashboard/order-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { QuickStartChecklist } from "@/components/dashboard/quick-start-checklist";
import { Countdown } from "@/components/ui/countdown";
import { useTranslation } from "@/i18n/provider";
import { useToast } from "@/components/ui/toast";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatNumber } from "@/lib/i18n-utils";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/types";

const BANNER_DISMISS_KEY = "savings-banner-dismissed";
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const { addToast } = useToast();
  const router = useRouter();

  const {
    savings,
    stats,
    chartData,
    urgentOrders,
    recentOrders,
    ordersLoading,
    refreshing,
    syncing,
    handleRefresh: doRefresh,
  } = useDashboardData();

  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < BANNER_DISMISS_DURATION) {
      setBannerDismissed(true);
    } else {
      setBannerDismissed(false);
    }
  }, []);

  async function handleRefresh() {
    const { synced } = await doRefresh();
    if (synced > 0) {
      addToast({
        type: "success",
        message: synced === 1
          ? t("orders.sync.recovered", { count: synced })
          : t("orders.sync.recoveredPlural", { count: synced }),
      });
    }
  }

  function handleOrderClick(orderId: number) {
    router.push(`/dashboard/orders?selected=${orderId}`);
  }

  function dismissBanner() {
    localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()));
    setBannerDismissed(true);
  }

  const showBanner = savings && savings.totalSaved > 500 && !bannerDismissed;

  return (
    <div className="space-y-6">
      {/* Page title + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-midnight">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-fog">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || syncing}
          className="h-10 lg:h-9 inline-flex items-center gap-1.5 justify-center rounded-full border border-silk bg-white px-3 text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50 shrink-0"
          aria-label={t("orders.refresh")}
          title={t("orders.refresh")}
        >
          <RefreshCw className={cn("h-4 w-4", (refreshing || syncing) && "animate-spin")} />
          {(refreshing || syncing) && (
            <span className="hidden sm:inline text-xs text-mist">
              {t("orders.sync.syncing")}
            </span>
          )}
        </button>
      </div>

      <QuickStartChecklist />

      {/* Savings Banner */}
      {showBanner && (
        <SavingsBanner
          savings={savings}
          locale={locale}
          t={t}
          onDismiss={dismissBanner}
        />
      )}

      {/* Urgent Orders */}
      {urgentOrders.length > 0 && (
        <UrgentOrdersWidget orders={urgentOrders} locale={locale} t={t} />
      )}

      {/* KPI Cards */}
      <KpiGrid savings={savings} stats={stats} locale={locale} t={t} />

      {/* Chart */}
      <DashboardChart chartData={chartData} t={t} />

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-mist" />
              <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-fog py-8 text-sm">
              {t("orders.table.noOrders")}
            </p>
          ) : (
            <>
              <div className="hidden lg:block">
                <OrderTable orders={recentOrders} onRowClick={handleOrderClick} />
              </div>
              <div className="flex flex-col gap-2 lg:hidden">
                {recentOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onClick={handleOrderClick} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legal footer */}
      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-ink-3 space-x-4">
        <a href="/privacy" className="hover:text-ink-2 transition">
          Confidentialité
        </a>
        <span>·</span>
        <a href="/terms" className="hover:text-ink-2 transition">
          CGU
        </a>
        <span>·</span>
        <a href="/data-rights" className="hover:text-ink-2 transition">
          Droits des données
        </a>
        <span>·</span>
        <span>
          © {new Date().getFullYear()} nortoo — Déclaration CNDP
          n°[À compléter]
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ──

function SavingsBanner({
  savings,
  locale,
  t,
  onDismiss,
}: {
  savings: { totalSaved: number; roiMultiple: number | null };
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-mint/10 to-mint/5 border border-mint/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-mint-deep">
            {t("dashboard.savings.title")}
          </p>
          <p className="font-display text-3xl font-bold text-midnight mt-1">
            {formatNumber(savings.totalSaved, locale)}{" "}
            <span className="text-base font-semibold text-fog">{t("currency.dh")}</span>
          </p>
          {savings.roiMultiple && (
            <p className="text-xs text-fog mt-1">
              {t("dashboard.savings.roi", { multiple: savings.roiMultiple })}
            </p>
          )}
        </div>
        <button onClick={onDismiss} className="text-mist hover:text-slate p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function UrgentOrdersWidget({
  orders,
  locale,
  t,
}: {
  orders: { id: number; externalRef: string | null; customerName: string | null; total: number; escalationPriority: number | null; reviewDeadline: string | null; pipelineStatus: string }[];
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-rose" />
          <CardTitle className="text-sm">
            {t("dashboard.urgentOrders.title")} ({orders.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {orders.slice(0, 5).map((o) => (
            <a
              key={o.id}
              href={`/dashboard/orders?selected=${o.id}`}
              className="flex items-center justify-between rounded-md border border-silk px-3 py-2 hover:bg-snow/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {o.escalationPriority && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded ${
                      o.escalationPriority <= 2
                        ? "bg-rose-bg text-rose"
                        : o.escalationPriority <= 4
                        ? "bg-amber-bg text-amber"
                        : "bg-snow text-fog"
                    }`}
                  >
                    P{o.escalationPriority}
                  </span>
                )}
                <span className="text-sm text-midnight truncate">
                  {o.externalRef ?? `#${o.id}`}
                </span>
                <span className="text-xs text-fog truncate">
                  {o.customerName ?? ""}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-semibold text-midnight">
                  {formatNumber(o.total, locale)} {t("currency.dh")}
                </span>
                {o.reviewDeadline && (
                  <Countdown deadline={o.reviewDeadline} />
                )}
                {o.pipelineStatus === "escalated" && (
                  <span className="text-[10px] font-medium text-rose bg-rose-bg px-1.5 py-0.5 rounded">
                    {t("dashboard.urgentOrders.escalated")}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KpiGrid({
  savings,
  stats,
  locale,
  t,
}: {
  savings: { totalSaved: number; deltaPercent: number } | null;
  stats: { avgScore: number; deliveryRate: number; blockedCount: number; totalOrders: number; changeScore?: number; changeDelivery?: number } | null;
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-4">
      <div className="min-w-[240px] snap-start lg:min-w-0">
        <KpiCard
          title={t("dashboard.kpi.savings")}
          value={savings ? `${formatNumber(savings.totalSaved, locale)} ${t("currency.dh")}` : "—"}
          change={savings ? t("dashboard.changes.vsPreviousPeriod", { delta: `${savings.deltaPercent >= 0 ? "+" : ""}${savings.deltaPercent}` }) : undefined}
          changeType={savings ? (savings.deltaPercent >= 0 ? "positive" : "negative") : "neutral"}
          icon={Coins}
          iconColor="text-amber"
        />
      </div>
      <div className="min-w-[240px] snap-start lg:min-w-0">
        <KpiCard
          title={t("dashboard.kpi.avgScore")}
          value={stats ? String(stats.avgScore) : "—"}
          change={stats?.changeScore !== undefined ? t("dashboard.changes.ptsVsLastWeek", { pts: `${stats.changeScore >= 0 ? "+" : ""}${stats.changeScore}` }) : undefined}
          changeType={stats?.changeScore !== undefined ? (stats.changeScore <= 0 ? "positive" : "negative") : "neutral"}
          icon={TrendingUp}
          iconColor="text-mint"
        />
      </div>
      <div className="min-w-[240px] snap-start lg:min-w-0">
        <KpiCard
          title={t("dashboard.kpi.deliveryRate")}
          value={stats ? `${stats.deliveryRate}%` : "—"}
          change={stats?.changeDelivery !== undefined ? t("dashboard.changes.thisMonth", { value: `${stats.changeDelivery >= 0 ? "+" : ""}${stats.changeDelivery}%` }) : undefined}
          changeType={stats?.changeDelivery !== undefined ? (stats.changeDelivery >= 0 ? "positive" : "negative") : "neutral"}
          icon={Truck}
          iconColor="text-mint"
        />
      </div>
      <div className="min-w-[240px] snap-start lg:min-w-0">
        <KpiCard
          title={t("dashboard.kpi.blocked")}
          value={stats ? String(stats.blockedCount) : "—"}
          change={stats ? t("dashboard.changes.ofTotal", { value: stats.totalOrders > 0 ? `${((stats.blockedCount / stats.totalOrders) * 100).toFixed(1)}%` : "0%" }) : undefined}
          changeType="neutral"
          icon={ShieldAlert}
          iconColor="text-violet"
        />
      </div>
    </div>
  );
}

const CHART_COLORS = {
  mint: "#00E5A0",
  blue: "#3B82F6",
  grid: "#E2E8F0",
  text: "#64748B",
} as const;

function DashboardChart({
  chartData,
  t,
}: {
  chartData: { date: string; commandes: number; score: number }[];
  t: (key: string) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.chart.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-fog">
            {t("dashboard.chart.noData")}
          </div>
        ) : (
          <div className="h-[200px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.mint} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.mint} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: CHART_COLORS.text }} axisLine={{ stroke: CHART_COLORS.grid }} />
                <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.text }} axisLine={{ stroke: CHART_COLORS.grid }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: `1px solid ${CHART_COLORS.grid}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="commandes" stroke={CHART_COLORS.mint} strokeWidth={2} fillOpacity={1} fill="url(#colorCommandes)" name={t("dashboard.chart.orders")} />
                <Area type="monotone" dataKey="score" stroke={CHART_COLORS.blue} strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name={t("dashboard.chart.avgScore")} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
