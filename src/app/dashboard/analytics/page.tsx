"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Coins,
  TrendingDown,
  Truck,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// MOCK DATA — Realistic Moroccan e-commerce over 30 days
// RTO trend: 35% → 28% → 20% → 13% to show CODPilot impact
// ═══════════════════════════════════════════════════════════

function generateDailyData(days: number) {
  const data = [];
  const now = new Date(2026, 1, 19); // Feb 19, 2026

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    // Week progression for RTO reduction
    const weekIndex = Math.floor((days - 1 - i) / 7);
    const baseTotals = [32, 36, 40, 45]; // Orders grow as confidence grows
    const baseRTO = [0.35, 0.28, 0.20, 0.13]; // RTO drops week by week
    const week = Math.min(weekIndex, 3);

    // Daily variation
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dailyMultiplier = isWeekend ? 0.7 : 1 + (Math.random() - 0.5) * 0.4;
    const orders = Math.round(baseTotals[week] * dailyMultiplier);
    const rtoRate = baseRTO[week] + (Math.random() - 0.5) * 0.06;
    const returns = Math.max(0, Math.round(orders * Math.max(0.05, rtoRate)));
    const delivered = orders - returns;

    data.push({
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      fullDate: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
      orders,
      delivered,
      returns,
      rtoRate: Math.round((returns / orders) * 100),
    });
  }
  return data;
}

const DAILY_DATA_90 = generateDailyData(90);

// ── Score distribution data ──
const scoreDistribution = [
  { range: "0-30", label: "Bas", count: 312, color: "#34D399" },
  { range: "31-65", label: "Moyen", count: 145, color: "#F59E0B" },
  { range: "66-85", label: "Élevé", count: 62, color: "#F97066" },
  { range: "86-100", label: "Critique", count: 23, color: "#8B5CF6" },
];

// ── City analysis data ──
const cityData = [
  { city: "Casablanca", orders: 186, delivered: 166, returns: 20, rtoRate: 11, avgScore: 28 },
  { city: "Rabat", orders: 94, delivered: 85, returns: 9, rtoRate: 9, avgScore: 24 },
  { city: "Marrakech", orders: 78, delivered: 65, returns: 13, rtoRate: 16, avgScore: 36 },
  { city: "Fès", orders: 52, delivered: 41, returns: 11, rtoRate: 21, avgScore: 42 },
  { city: "Tanger", orders: 48, delivered: 40, returns: 8, rtoRate: 16, avgScore: 34 },
  { city: "Oujda", orders: 31, delivered: 21, returns: 10, rtoRate: 33, avgScore: 55 },
  { city: "Agadir", orders: 27, delivered: 24, returns: 3, rtoRate: 12, avgScore: 29 },
  { city: "Meknès", orders: 22, delivered: 19, returns: 3, rtoRate: 14, avgScore: 31 },
  { city: "Taza", orders: 19, delivered: 11, returns: 8, rtoRate: 42, avgScore: 68 },
  { city: "Errachidia", orders: 15, delivered: 8, returns: 7, rtoRate: 47, avgScore: 72 },
];

// ── Hourly patterns data ──
const hourlyData = Array.from({ length: 24 }, (_, h) => {
  // Orders distribution: peak at 10-12h and 20-22h, low 1-5h
  const isNight = h >= 1 && h <= 5;
  const isPeak = (h >= 10 && h <= 12) || (h >= 20 && h <= 22);
  const isMorning = h >= 8 && h <= 9;
  const isAfternoon = h >= 14 && h <= 18;

  let orders: number;
  if (isNight) orders = Math.round(3 + Math.random() * 4);
  else if (isPeak) orders = Math.round(28 + Math.random() * 15);
  else if (isMorning || isAfternoon) orders = Math.round(18 + Math.random() * 10);
  else orders = Math.round(8 + Math.random() * 8);

  // Risk is 2× higher at night
  const riskRate = isNight
    ? Math.round(35 + Math.random() * 20)
    : isPeak
      ? Math.round(12 + Math.random() * 8)
      : Math.round(16 + Math.random() * 12);

  return {
    hour: `${h}h`,
    hourNum: h,
    orders,
    riskRate,
    label: isNight ? "Nuit" : isPeak ? "Pic" : "Normal",
  };
});

// ── Decision breakdown data ──
const decisionData = [
  { name: "Expédier", value: 312, pct: 57.6, color: "#34D399" },
  { name: "Vérifier", value: 145, pct: 26.8, color: "#F59E0B" },
  { name: "Signaler", value: 62, pct: 11.4, color: "#F97066" },
  { name: "Bloquer", value: 23, pct: 4.2, color: "#8B5CF6" },
];

// ═══════════════════════════════════════════════════════════
// PERIOD SELECTOR
// ═══════════════════════════════════════════════════════════

type Period = "7j" | "30j" | "90j";

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex items-center rounded-sm border border-border bg-sand/50 p-0.5">
      {(["7j", "30j", "90j"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-xs px-3 py-1.5 text-xs font-medium transition-all",
            value === p
              ? "bg-white text-ink-1 shadow-sm"
              : "text-ink-3 hover:text-ink-2"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CUSTOM TOOLTIPS
// ═══════════════════════════════════════════════════════════

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #E7E0D8",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,.08)",
  padding: "12px 14px",
};

function RtoTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={tooltipStyle}>
      <p className="font-medium text-ink-1 text-xs mb-1.5">{d?.fullDate}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-ink-3 inline-block" />
          <span className="text-ink-3">Commandes:</span>
          <span className="font-mono font-bold text-ink-1">{d?.orders}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-mint inline-block" />
          <span className="text-ink-3">Livrées:</span>
          <span className="font-mono font-bold text-mint-deep">{d?.delivered}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-coral inline-block" />
          <span className="text-ink-3">Retours:</span>
          <span className="font-mono font-bold text-coral">{d?.returns}</span>
        </div>
        <div className="flex items-center gap-2 text-xs border-t border-border pt-1 mt-1">
          <span className="text-ink-3">Taux RTO:</span>
          <span className="font-mono font-bold text-coral">{d?.rtoRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SORTABLE TABLE HEADER
// ═══════════════════════════════════════════════════════════

type SortKey = "city" | "orders" | "delivered" | "returns" | "rtoRate" | "avgScore";
type SortDir = "asc" | "desc";

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-medium text-ink-3 transition-colors hover:text-ink-1",
        align === "right" ? "text-right" : "text-left"
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col -space-y-1">
          <ChevronUp
            className={cn("h-2.5 w-2.5", isActive && currentDir === "asc" ? "text-sun" : "text-ink-4")}
          />
          <ChevronDown
            className={cn("h-2.5 w-2.5", isActive && currentDir === "desc" ? "text-sun" : "text-ink-4")}
          />
        </span>
      </span>
    </th>
  );
}

// ═══════════════════════════════════════════════════════════
// RTO PROGRESS BAR
// ═══════════════════════════════════════════════════════════

function RtoBar({ value }: { value: number }) {
  const color =
    value <= 15 ? "bg-mint" : value <= 25 ? "bg-sun" : value <= 40 ? "bg-coral" : "bg-violet";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-sand">
        <div
          className={cn("h-1.5 rounded-full transition-all", color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="font-mono text-xs font-bold text-ink-1">{value}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30j");
  const [citySort, setCitySort] = useState<SortKey>("orders");
  const [citySortDir, setCitySortDir] = useState<SortDir>("desc");

  // Filter daily data by period
  const dailyData = useMemo(() => {
    const days = period === "7j" ? 7 : period === "30j" ? 30 : 90;
    return DAILY_DATA_90.slice(-days);
  }, [period]);

  // ── KPI calculations ──
  const totalOrders = dailyData.reduce((s, d) => s + d.orders, 0);
  const totalReturns = dailyData.reduce((s, d) => s + d.returns, 0);
  const totalDelivered = totalOrders - totalReturns;
  const rtoRate = totalOrders > 0 ? Math.round((totalReturns / totalOrders) * 100) : 0;
  const deliveryRate = 100 - rtoRate;
  const baseline = 35;

  // Returns avoided = (baseline% - actual%) × total orders
  const returnsAvoided = Math.max(0, Math.round(totalOrders * (baseline - rtoRate) / 100));
  const savings = returnsAvoided * 45; // 45 DH per avoided return

  // Previous period comparison
  const days = period === "7j" ? 7 : period === "30j" ? 30 : 90;
  const prevData = DAILY_DATA_90.slice(-(days * 2), -days);
  const prevReturns = prevData.reduce((s, d) => s + d.returns, 0);
  const prevOrders = prevData.reduce((s, d) => s + d.orders, 0);
  const prevRtoRate = prevOrders > 0 ? Math.round((prevReturns / prevOrders) * 100) : 0;
  const prevReturnsAvoided = Math.max(0, Math.round(prevOrders * (baseline - prevRtoRate) / 100));
  const prevSavings = prevReturnsAvoided * 45;
  const savingsChange = prevSavings > 0 ? Math.round(((savings - prevSavings) / prevSavings) * 100) : 0;

  // ROI
  const subscriptionCost = 699;
  const roi = subscriptionCost > 0 ? (savings - subscriptionCost) / subscriptionCost : 0;
  const roiDisplay = roi > 0 ? `${roi.toFixed(1)}×` : "—";

  // RTO delta vs baseline
  const rtoDelta = rtoRate - baseline;

  // ── City sort ──
  const handleCitySort = (key: SortKey) => {
    if (citySort === key) {
      setCitySortDir(citySortDir === "asc" ? "desc" : "asc");
    } else {
      setCitySort(key);
      setCitySortDir("desc");
    }
  };

  const sortedCities = useMemo(() => {
    return [...cityData].sort((a, b) => {
      const aVal = a[citySort];
      const bVal = b[citySort];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return citySortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return citySortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [citySort, citySortDir]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sora text-2xl font-bold text-ink-1">Analytique</h1>
          <p className="text-sm text-ink-3">
            Performance anti-fraude, tendances RTO et ROI
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* ═══ 1. KPI ROW ═══ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Économies estimées */}
        <div className="rounded-[18px] border border-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-3">Économies estimées</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sun-light">
              <Coins className="h-4.5 w-4.5 text-sun" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-sora text-2xl font-bold text-ink-1">
              {savings.toLocaleString("fr-FR")} <span className="text-base font-semibold text-ink-3">DH</span>
            </p>
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", savingsChange >= 0 ? "text-mint-deep" : "text-coral")}>
              {savingsChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {savingsChange >= 0 ? "+" : ""}{savingsChange}% vs période précédente
            </p>
          </div>
        </div>

        {/* Taux RTO actuel */}
        <div className="rounded-[18px] border border-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-3">Taux RTO actuel</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-coral-light">
              <TrendingDown className="h-4.5 w-4.5 text-coral" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-sora text-2xl font-bold text-ink-1">
              {rtoRate}<span className="text-base font-semibold text-ink-3">%</span>
            </p>
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", rtoDelta <= 0 ? "text-mint-deep" : "text-coral")}>
              {rtoDelta <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              {rtoDelta} pts vs baseline ({baseline}%)
            </p>
          </div>
        </div>

        {/* Taux de livraison */}
        <div className="rounded-[18px] border border-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-3">Taux de livraison</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-mint-light">
              <Truck className="h-4.5 w-4.5 text-mint-deep" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-sora text-2xl font-bold text-ink-1">
              {deliveryRate}<span className="text-base font-semibold text-ink-3">%</span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-mint-deep">
              <ArrowUpRight className="h-3 w-3" />
              {totalDelivered.toLocaleString("fr-FR")} commandes livrées
            </p>
          </div>
        </div>

        {/* ROI CODPilot */}
        <div className="rounded-[18px] border border-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-3">ROI CODPilot</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-violet-light">
              <Flame className="h-4.5 w-4.5 text-violet" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-sora text-2xl font-bold text-ink-1">{roiDisplay}</p>
            <p className="mt-1 text-xs font-medium text-ink-3">
              ({savings.toLocaleString("fr-FR")} − {subscriptionCost}) / {subscriptionCost} DH
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 2. RTO TREND LINE CHART ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Tendance du taux RTO</CardTitle>
            <p className="mt-1 text-xs text-ink-3">
              Taux de retour quotidien vs baseline ({baseline}%)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="rtoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97066" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F97066" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D8" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#78716C" }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === "7j" ? 0 : period === "30j" ? 4 : 13}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#78716C" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 50]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<RtoTooltip />} />
                <ReferenceLine
                  y={baseline}
                  stroke="#A8A29E"
                  strokeDasharray="6 4"
                  label={{
                    value: `Baseline ${baseline}%`,
                    position: "right",
                    fontSize: 11,
                    fill: "#A8A29E",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rtoRate"
                  stroke="#F97066"
                  strokeWidth={2.5}
                  fill="url(#rtoGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#F97066", stroke: "#fff", strokeWidth: 2 }}
                  name="Taux RTO"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ═══ ROW: SCORE DISTRIBUTION + DECISIONS ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ═══ 3. SCORE DISTRIBUTION ═══ */}
        <Card className="rounded-[18px]">
          <CardHeader>
            <CardTitle>Distribution des scores</CardTitle>
            <p className="text-xs text-ink-3">Volume de commandes par tranche de risque</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} barSize={48} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D8" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(0,0,0,.03)" }}
                    formatter={(value: number) => [`${value} commandes`, "Volume"]}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Commandes">
                    {scoreDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {scoreDistribution.map((s) => (
                <div key={s.range} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-ink-3">{s.range}</span>
                  <span className="font-mono text-xs font-bold text-ink-2">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══ 6. DECISION DONUT ═══ */}
        <Card className="rounded-[18px]">
          <CardHeader>
            <CardTitle>Répartition des décisions</CardTitle>
            <p className="text-xs text-ink-3">Actions automatiques sur les commandes</p>
          </CardHeader>
          <CardContent>
            <div className="flex h-[280px] items-center gap-8">
              <div className="relative h-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {decisionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => [`${value} commandes`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-mono text-2xl font-bold text-ink-1">542</p>
                  <p className="text-[10px] text-ink-3">total</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {decisionData.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <div>
                      <p className="text-sm font-medium text-ink-2">{d.name}</p>
                      <p className="text-xs text-ink-3">
                        <span className="font-mono font-bold text-ink-1">{d.value}</span>
                        {" "}· {d.pct}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ 4. CITY ANALYSIS TABLE ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader>
          <CardTitle>Analyse par ville</CardTitle>
          <p className="text-xs text-ink-3">Top 10 villes par volume de commandes</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <SortableHeader label="Ville" sortKey="city" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} />
                  <SortableHeader label="Commandes" sortKey="orders" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                  <SortableHeader label="Livrées" sortKey="delivered" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                  <SortableHeader label="Retours" sortKey="returns" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                  <SortableHeader label="Taux RTO" sortKey="rtoRate" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                  <SortableHeader label="Score moyen" sortKey="avgScore" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedCities.map((c) => (
                  <tr key={c.city} className="border-b border-border/50 transition-colors hover:bg-sand/30">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-ink-1">{c.city}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-ink-2">{c.orders}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-mint-deep">{c.delivered}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-coral">{c.returns}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RtoBar value={c.rtoRate} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                          c.avgScore <= 30 && "bg-mint-light text-mint-deep",
                          c.avgScore > 30 && c.avgScore <= 65 && "bg-sun-light text-sun-deep",
                          c.avgScore > 65 && c.avgScore <= 85 && "bg-coral-light text-coral",
                          c.avgScore > 85 && "bg-violet-light text-violet"
                        )}
                      >
                        {c.avgScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ═══ 5. HOURLY PATTERNS ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-3" />
              Patterns temporels
            </CardTitle>
            <p className="mt-1 text-xs text-ink-3">
              Volume de commandes et taux de risque par heure — les commandes nocturnes (1h-5h) sont 2× plus risquées
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E0D8" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "#78716C" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="orders"
                  tick={{ fontSize: 11, fill: "#78716C" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="risk"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#78716C" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 60]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === "Commandes") return [value, name];
                    return [`${value}%`, "Taux de risque"];
                  }}
                />
                <Bar
                  yAxisId="orders"
                  dataKey="orders"
                  radius={[4, 4, 0, 0]}
                  name="Commandes"
                  barSize={16}
                >
                  {hourlyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.hourNum >= 1 && entry.hourNum <= 5 ? "#F97066" : "#0EA5E9"}
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="risk"
                  dataKey="riskRate"
                  radius={[4, 4, 0, 0]}
                  name="Risque"
                  barSize={16}
                  fillOpacity={0.25}
                >
                  {hourlyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.hourNum >= 1 && entry.hourNum <= 5 ? "#F97066" : "#A8A29E"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-ocean/70" />
              <span className="text-xs text-ink-3">Commandes (jour)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-coral/70" />
              <span className="text-xs text-ink-3">Commandes (nuit 1h-5h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-ink-4/25" />
              <span className="text-xs text-ink-3">Taux de risque (%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
