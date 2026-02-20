"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
  Package,
  AlertTriangle,
  MapPin,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Savings API response type ──
interface SavingsApiData {
  totalSaved: number;
  ordersSaved: number;
  avgSavedPerOrder: number;
  projectedMonthlySaved: number;
  projectedYearlySaved: number;
  roiMultiple: number | null;
  deltaPercent: number;
  breakdown: {
    autoBlocked: { count: number; amount: number };
    merchantBlocked: { count: number; amount: number };
    flaggedNotShipped: { count: number; amount: number };
  };
  topProducts: { name: string; saved: number; count: number }[];
  topCities: { name: string; saved: number; count: number }[];
  period: { days: number; from: string; to: string };
}

// ═══════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════

interface ProductAnalytics {
  id: number;
  productId: string;
  productName: string;
  productCategory: string;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  rtoRate: number;
  avgOrderValue: number;
  totalRevenue: number;
  lastOrderAt: string;
  riskLevel: string;
}

interface ProductsApiResponse {
  data: ProductAnalytics[];
  meta: { total: number };
}

interface ZoneAnalytics {
  id: number;
  city: string;
  zone: string;
  postalCode: string | null;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  blockedOrders: number;
  rtoRate: number;
  avgScore: number;
  avgDeliveryAttempts: number | null;
  lastOrderAt: string | null;
}

interface ZonesApiResponse {
  data: ZoneAnalytics[];
  meta: { total: number; highRiskZones: number };
}

interface CityAnalytics {
  id: number;
  cityNormalized: string;
  cityDisplay: string;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  rtoRate: number;
  avgScore: number;
  avgOrderValue: number;
  riskTier: "safe" | "moderate" | "risky" | "dangerous" | "unknown";
  lastOrderAt: string;
}

interface CitiesApiResponse {
  data: CityAnalytics[];
  meta: { total: number };
}

// ═══════════════════════════════════════════════════════════
// MOCK DATA — Realistic Moroccan e-commerce over 30 days
// RTO trend: 35% → 28% → 20% → 13% to show Siift impact
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
  { range: "0-30", label: "Bas", count: 312, color: "#00E5A0" },
  { range: "31-65", label: "Moyen", count: 145, color: "#F59E0B" },
  { range: "66-85", label: "Élevé", count: 62, color: "#F43F5E" },
  { range: "86-100", label: "Critique", count: 23, color: "#8B5CF6" },
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
  { name: "Expédier", value: 312, pct: 57.6, color: "#00E5A0" },
  { name: "Vérifier", value: 145, pct: 26.8, color: "#F59E0B" },
  { name: "Signaler", value: 62, pct: 11.4, color: "#F43F5E" },
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
    <div className="flex items-center rounded-sm border border-silk bg-snow/50 p-0.5">
      {(["7j", "30j", "90j"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-xs px-3 py-1.5 text-xs font-medium transition-all",
            value === p
              ? "bg-white text-midnight shadow-sm"
              : "text-fog hover:text-slate"
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
  border: "1px solid #E2E8F0",
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
      <p className="font-medium text-midnight text-xs mb-1.5">{d?.fullDate}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-fog inline-block" />
          <span className="text-fog">Commandes:</span>
          <span className="font-mono font-bold text-midnight">{d?.orders}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-mint inline-block" />
          <span className="text-fog">Livrées:</span>
          <span className="font-mono font-bold text-mint-deep">{d?.delivered}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-rose inline-block" />
          <span className="text-fog">Retours:</span>
          <span className="font-mono font-bold text-rose">{d?.returns}</span>
        </div>
        <div className="flex items-center gap-2 text-xs border-t border-silk pt-1 mt-1">
          <span className="text-fog">Taux RTO:</span>
          <span className="font-mono font-bold text-rose">{d?.rtoRate}%</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SORTABLE TABLE HEADERS
// ═══════════════════════════════════════════════════════════

type CitySortKey = "cityDisplay" | "totalOrders" | "deliveredOrders" | "returnedOrders" | "rtoRate" | "avgScore" | "riskTier";
type ProductSortKey = "productName" | "productCategory" | "totalOrders" | "deliveredOrders" | "returnedOrders" | "rtoRate" | "totalRevenue";
type ZoneSortKey = "city" | "zone" | "totalOrders" | "deliveredOrders" | "returnedOrders" | "rtoRate" | "avgScore";
type SortDir = "asc" | "desc";

function SortableHeader<T extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: T;
  currentSort: T;
  currentDir: SortDir;
  onSort: (key: T) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-medium text-fog transition-colors hover:text-midnight",
        align === "right" ? "text-right" : "text-left"
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col -space-y-1">
          <ChevronUp
            className={cn("h-2.5 w-2.5", isActive && currentDir === "asc" ? "text-mint" : "text-mist")}
          />
          <ChevronDown
            className={cn("h-2.5 w-2.5", isActive && currentDir === "desc" ? "text-mint" : "text-mist")}
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
    value <= 15 ? "bg-mint" : value <= 25 ? "bg-amber" : value <= 40 ? "bg-rose" : "bg-violet";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-snow">
        <div
          className={cn("h-1.5 rounded-full transition-all", color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="font-mono text-xs font-bold text-midnight">{value}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// RISK TIER BADGE (Cities)
// ═══════════════════════════════════════════════════════════

function RiskTierBadge({ tier }: { tier: CityAnalytics["riskTier"] }) {
  const config: Record<CityAnalytics["riskTier"], { label: string; bg: string; text: string }> = {
    safe: { label: "Fiable", bg: "bg-mint-bg", text: "text-mint-deep" },
    moderate: { label: "Modéré", bg: "bg-amber-bg", text: "text-amber" },
    risky: { label: "Risque", bg: "bg-rose-bg", text: "text-rose" },
    dangerous: { label: "Dangereux", bg: "bg-violet-bg", text: "text-violet" },
    unknown: { label: "Inconnu", bg: "bg-snow", text: "text-fog" },
  };
  const c = config[tier] ?? config.unknown;
  return (
    <span className={cn("inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold", c.bg, c.text)}>
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCT RISK BADGE
// ═══════════════════════════════════════════════════════════

function ProductRiskBadge({ rtoRate }: { rtoRate: number }) {
  if (rtoRate > 0.30) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-rose-bg text-rose">
        Risque élevé
      </span>
    );
  }
  if (rtoRate >= 0.15) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-amber-bg text-amber">
        À surveiller
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-mint-bg text-mint-deep">
      Fiable
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// ZONE RISK BADGE
// ═══════════════════════════════════════════════════════════

function ZoneRiskBadge({ rtoRate }: { rtoRate: number }) {
  if (rtoRate > 0.35) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-rose-bg text-rose">
        Critique
      </span>
    );
  }
  if (rtoRate > 0.20) {
    return (
      <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-amber-bg text-amber">
        Risque
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-xs px-2 py-0.5 text-[11px] font-semibold bg-mint-bg text-mint-deep">
      Fiable
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// CAPITALIZE HELPER
// ═══════════════════════════════════════════════════════════

function capitalize(s: string): string {
  return s.split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ═══════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════

function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }, (_, j) => (
            <div key={j} className="h-4 flex-1 animate-pulse rounded bg-snow" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30j");

  // ── City state ──
  const [citySort, setCitySort] = useState<CitySortKey>("totalOrders");
  const [citySortDir, setCitySortDir] = useState<SortDir>("desc");
  const [cityData, setCityData] = useState<CityAnalytics[]>([]);
  const [cityLoading, setCityLoading] = useState(true);
  const [cityError, setCityError] = useState<string | null>(null);

  // ── Product state ──
  const [productSort, setProductSort] = useState<ProductSortKey>("totalOrders");
  const [productSortDir, setProductSortDir] = useState<SortDir>("desc");
  const [productData, setProductData] = useState<ProductAnalytics[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // ── Zone state ──
  const [zoneSort, setZoneSort] = useState<ZoneSortKey>("totalOrders");
  const [zoneSortDir, setZoneSortDir] = useState<SortDir>("desc");
  const [zoneData, setZoneData] = useState<ZoneAnalytics[]>([]);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [zoneCityFilter, setZoneCityFilter] = useState<string>("");
  const [exportLoading, setExportLoading] = useState(false);

  // ── Savings state ──
  const [savingsData, setSavingsData] = useState<SavingsApiData | null>(null);
  const [savingsLoading, setSavingsLoading] = useState(true);

  // ── Fetch savings data (period-aware) ──
  useEffect(() => {
    setSavingsLoading(true);
    const days = period === "7j" ? 7 : period === "30j" ? 30 : 90;
    fetch(`/api/dashboard/savings?period=${days}d`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setSavingsData(json.data);
      })
      .catch(() => {})
      .finally(() => setSavingsLoading(false));
  }, [period]);

  // ── Fetch city data ──
  useEffect(() => {
    setCityLoading(true);
    setCityError(null);
    fetch("/api/analytics/cities")
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json() as Promise<CitiesApiResponse>;
      })
      .then((json) => {
        setCityData(json.data);
      })
      .catch((err) => {
        setCityError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        setCityLoading(false);
      });
  }, []);

  // ── Fetch product data ──
  useEffect(() => {
    setProductLoading(true);
    setProductError(null);
    fetch("/api/analytics/products")
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json() as Promise<ProductsApiResponse>;
      })
      .then((json) => {
        setProductData(json.data);
      })
      .catch((err) => {
        setProductError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        setProductLoading(false);
      });
  }, []);

  // ── Fetch zone data ──
  useEffect(() => {
    setZoneLoading(true);
    setZoneError(null);
    const params = new URLSearchParams();
    if (zoneCityFilter) params.set("city", zoneCityFilter);
    fetch(`/api/analytics/zones?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json() as Promise<ZonesApiResponse>;
      })
      .then((json) => {
        setZoneData(json.data);
      })
      .catch((err) => {
        setZoneError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        setZoneLoading(false);
      });
  }, [zoneCityFilter]);

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

  // Savings from API
  const savings = savingsData?.totalSaved ?? 0;
  const savingsChange = savingsData?.deltaPercent ?? 0;
  const roiDisplay = savingsData?.roiMultiple ? `${savingsData.roiMultiple}\u00D7` : "\u2014";

  // RTO delta vs baseline
  const rtoDelta = rtoRate - baseline;

  // ── City sort ──
  const handleCitySort = useCallback((key: CitySortKey) => {
    setCitySort((prev) => {
      if (prev === key) {
        setCitySortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setCitySortDir("desc");
      return key;
    });
  }, []);

  const sortedCities = useMemo(() => {
    return [...cityData].sort((a, b) => {
      const aVal = a[citySort];
      const bVal = b[citySort];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return citySortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return citySortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [cityData, citySort, citySortDir]);

  // ── Product sort ──
  const handleProductSort = useCallback((key: ProductSortKey) => {
    setProductSort((prev) => {
      if (prev === key) {
        setProductSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setProductSortDir("desc");
      return key;
    });
  }, []);

  const sortedProducts = useMemo(() => {
    return [...productData].sort((a, b) => {
      const aVal = a[productSort];
      const bVal = b[productSort];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return productSortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return productSortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [productData, productSort, productSortDir]);

  // ── Product KPIs ──
  const highRiskProducts = useMemo(
    () => productData.filter((p) => p.rtoRate > 0.30 && p.totalOrders >= 5),
    [productData]
  );

  const revenueAtRisk = useMemo(
    () => highRiskProducts.reduce((s, p) => s + p.totalRevenue, 0),
    [highRiskProducts]
  );

  // ── Zone sort ──
  const handleZoneSort = useCallback((key: ZoneSortKey) => {
    setZoneSort((prev) => {
      if (prev === key) {
        setZoneSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setZoneSortDir("desc");
      return key;
    });
  }, []);

  const sortedZones = useMemo(() => {
    return [...zoneData].sort((a, b) => {
      const aVal = a[zoneSort];
      const bVal = b[zoneSort];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return zoneSortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return zoneSortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [zoneData, zoneSort, zoneSortDir]);

  // ── Zone KPIs ──
  const zoneCities = useMemo(() => [...new Set(zoneData.map((z) => z.city))].sort(), [zoneData]);
  const criticalZones = useMemo(() => zoneData.filter((z) => z.rtoRate > 0.35).length, [zoneData]);
  const safeZones = useMemo(() => zoneData.filter((z) => z.rtoRate < 0.15 && z.totalOrders >= 5).length, [zoneData]);

  const top3RtoConcentration = useMemo(() => {
    if (productData.length === 0) return 0;
    const sorted = [...productData].sort((a, b) => b.rtoRate - a.rtoRate);
    const top3Returns = sorted.slice(0, 3).reduce((s, p) => s + p.returnedOrders, 0);
    const totalReturnsAll = productData.reduce((s, p) => s + p.returnedOrders, 0);
    return totalReturnsAll > 0 ? Math.round((top3Returns / totalReturnsAll) * 100) : 0;
  }, [productData]);

  async function handleExportAnalytics() {
    setExportLoading(true);
    try {
      const days = period === "7j" ? 7 : period === "90j" ? 90 : 30;
      const res = await fetch(`/api/analytics/export?period=${days}`);
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Erreur d'export");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "analytique.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-midnight">Analytique</h1>
          <p className="text-sm text-fog">
            Performance anti-fraude, tendances RTO et ROI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button
            onClick={handleExportAnalytics}
            disabled={exportLoading}
            className="h-9 inline-flex items-center gap-2 rounded-full border border-silk bg-white px-4 text-sm font-medium text-slate hover:bg-snow transition-colors disabled:opacity-50 shrink-0"
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      {/* ═══ 1. KPI ROW — horizontal scroll mobile, grid desktop ═══ */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-4">
        {/* Économies estimées */}
        <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fog">Économies estimées</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-bg">
              <Coins className="h-4.5 w-4.5 text-amber" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold text-midnight">
              {savings.toLocaleString("fr-FR")} <span className="text-base font-semibold text-fog">DH</span>
            </p>
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", savingsChange >= 0 ? "text-mint-deep" : "text-rose")}>
              {savingsChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {savingsChange >= 0 ? "+" : ""}{savingsChange}% vs période précédente
            </p>
          </div>
        </div>

        {/* Taux RTO actuel */}
        <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fog">Taux RTO actuel</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-rose-bg">
              <TrendingDown className="h-4.5 w-4.5 text-rose" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold text-midnight">
              {rtoRate}<span className="text-base font-semibold text-fog">%</span>
            </p>
            <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", rtoDelta <= 0 ? "text-mint-deep" : "text-rose")}>
              {rtoDelta <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              {rtoDelta} pts vs baseline ({baseline}%)
            </p>
          </div>
        </div>

        {/* Taux de livraison */}
        <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fog">Taux de livraison</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-mint-bg">
              <Truck className="h-4.5 w-4.5 text-mint-deep" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold text-midnight">
              {deliveryRate}<span className="text-base font-semibold text-fog">%</span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-mint-deep">
              <ArrowUpRight className="h-3 w-3" />
              {totalDelivered.toLocaleString("fr-FR")} commandes livrées
            </p>
          </div>
        </div>

        {/* ROI Siift */}
        <div className="min-w-[240px] snap-start lg:min-w-0 rounded-[18px] border border-silk bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fog">ROI Siift</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-violet-bg">
              <Flame className="h-4.5 w-4.5 text-violet" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl font-bold text-midnight">{roiDisplay}</p>
            <p className="mt-1 text-xs font-medium text-fog">
              {savingsData?.projectedMonthlySaved
                ? `${savingsData.projectedMonthlySaved.toLocaleString("fr-FR")} DH/mois projet\u00E9`
                : "\u2014"}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ IMPACT FINANCIER ═══ */}
      {savingsData && !savingsLoading && (
        <Card className="rounded-[18px]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber" />
              <CardTitle>Impact financier</CardTitle>
            </div>
            <p className="text-xs text-fog">D\u00E9tail des \u00E9conomies g\u00E9n\u00E9r\u00E9es par Siift</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mini KPIs */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-silk bg-snow/50 p-4">
                <p className="text-xs font-medium text-fog">Commandes \u00E9vit\u00E9es</p>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {savingsData.ordersSaved}
                </p>
              </div>
              <div className="rounded-xl border border-silk bg-snow/50 p-4">
                <p className="text-xs font-medium text-fog">\u00C9conomie moy./commande</p>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {savingsData.avgSavedPerOrder} <span className="text-sm font-semibold text-fog">DH</span>
                </p>
              </div>
              <div className="rounded-xl border border-silk bg-snow/50 p-4">
                <p className="text-xs font-medium text-fog">Projection mensuelle</p>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {savingsData.projectedMonthlySaved.toLocaleString("fr-FR")} <span className="text-sm font-semibold text-fog">DH</span>
                </p>
              </div>
              <div className="rounded-xl border border-silk bg-snow/50 p-4">
                <p className="text-xs font-medium text-fog">ROI Siift</p>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {savingsData.roiMultiple ? `${savingsData.roiMultiple}\u00D7` : "\u2014"}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div>
              <p className="text-sm font-medium text-midnight mb-3">R\u00E9partition des \u00E9conomies</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-sm bg-snow px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet" />
                    <span className="text-sm text-slate">Auto-bloqu\u00E9es</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-fog">{savingsData.breakdown.autoBlocked.count} commandes</span>
                    <span className="font-mono text-sm font-bold text-midnight">
                      {savingsData.breakdown.autoBlocked.amount.toLocaleString("fr-FR")} DH
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-sm bg-snow px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose" />
                    <span className="text-sm text-slate">Bloqu\u00E9es (marchand)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-fog">{savingsData.breakdown.merchantBlocked.count} commandes</span>
                    <span className="font-mono text-sm font-bold text-midnight">
                      {savingsData.breakdown.merchantBlocked.amount.toLocaleString("fr-FR")} DH
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-sm bg-snow px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber" />
                    <span className="text-sm text-slate">Signal\u00E9es / escalad\u00E9es</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-fog">{savingsData.breakdown.flaggedNotShipped.count} commandes</span>
                    <span className="font-mono text-sm font-bold text-midnight">
                      {savingsData.breakdown.flaggedNotShipped.amount.toLocaleString("fr-FR")} DH
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top products & cities */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top products by savings */}
              {savingsData.topProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-midnight mb-3">Top produits (par \u00E9conomies)</p>
                  <div className="space-y-1.5">
                    {savingsData.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between rounded-sm bg-snow px-3 py-2">
                        <span className="text-sm text-slate truncate max-w-[60%]">{p.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-fog">{p.count} cmd</span>
                          <span className="font-mono text-sm font-bold text-midnight">
                            {p.saved.toLocaleString("fr-FR")} DH
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top cities by savings */}
              {savingsData.topCities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-midnight mb-3">Top villes (par \u00E9conomies)</p>
                  <div className="space-y-1.5">
                    {savingsData.topCities.map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-sm bg-snow px-3 py-2">
                        <span className="text-sm text-slate">{c.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-fog">{c.count} cmd</span>
                          <span className="font-mono text-sm font-bold text-midnight">
                            {c.saved.toLocaleString("fr-FR")} DH
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ 2. RTO TREND LINE CHART ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Tendance du taux RTO</CardTitle>
            <p className="mt-1 text-xs text-fog">
              Taux de retour quotidien vs baseline ({baseline}%)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] lg:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="rtoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === "7j" ? 0 : period === "30j" ? 4 : 13}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 50]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<RtoTooltip />} />
                <ReferenceLine
                  y={baseline}
                  stroke="#94A3B8"
                  strokeDasharray="6 4"
                  label={{
                    value: `Baseline ${baseline}%`,
                    position: "right",
                    fontSize: 11,
                    fill: "#94A3B8",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rtoRate"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fill="url(#rtoGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#F43F5E", stroke: "#fff", strokeWidth: 2 }}
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
            <p className="text-xs text-fog">Volume de commandes par tranche de risque</p>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} barSize={48} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748B" }}
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
                  <span className="text-xs text-fog">{s.range}</span>
                  <span className="font-mono text-xs font-bold text-slate">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══ 6. DECISION DONUT ═══ */}
        <Card className="rounded-[18px]">
          <CardHeader>
            <CardTitle>Répartition des décisions</CardTitle>
            <p className="text-xs text-fog">Actions automatiques sur les commandes</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row h-auto lg:h-[280px] items-center gap-4 lg:gap-8">
              <div className="relative h-[200px] lg:h-full w-full lg:w-auto flex-1">
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
                  <p className="font-mono text-2xl font-bold text-midnight">542</p>
                  <p className="text-[10px] text-fog">total</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 lg:flex-col lg:flex-nowrap lg:justify-start">
                {decisionData.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <div>
                      <p className="text-sm font-medium text-slate">{d.name}</p>
                      <p className="text-xs text-fog">
                        <span className="font-mono font-bold text-midnight">{d.value}</span>
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

      {/* ═══ PRODUCTS SECTION — Produits à risque ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-rose" />
            <CardTitle>Produits à risque</CardTitle>
          </div>
          <p className="text-xs text-fog">Analyse du taux de retour par produit</p>
        </CardHeader>
        <CardContent>
          {/* ── Product mini KPIs ── */}
          {productLoading ? (
            <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[200px] snap-start lg:min-w-0 h-20 animate-pulse rounded-xl bg-snow" />
              ))}
            </div>
          ) : productError ? null : (
            <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
              {/* High-risk product count */}
              <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose" />
                  <p className="text-xs font-medium text-fog">Produits à risque élevé</p>
                </div>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {highRiskProducts.length}
                </p>
                <p className="text-[11px] text-fog">
                  RTO &gt; 30%, min 5 commandes
                </p>
              </div>

              {/* Revenue at risk */}
              <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber" />
                  <p className="text-xs font-medium text-fog">DH de revenus à risque</p>
                </div>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {revenueAtRisk.toLocaleString("fr-FR")} <span className="text-sm font-semibold text-fog">DH</span>
                </p>
                <p className="text-[11px] text-fog">
                  CA des produits à risque élevé
                </p>
              </div>

              {/* Top 3 RTO concentration */}
              <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-violet" />
                  <p className="text-xs font-medium text-fog">RTO concentré sur top 3</p>
                </div>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {top3RtoConcentration}<span className="text-sm font-semibold text-fog">%</span>
                </p>
                <p className="text-[11px] text-fog">
                  % des retours sur les 3 pires produits
                </p>
              </div>
            </div>
          )}

          {/* ── Product table ── */}
          {productLoading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : productError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-rose mb-3" />
              <p className="text-sm font-medium text-midnight">Erreur de chargement</p>
              <p className="text-xs text-fog mt-1">{productError}</p>
            </div>
          ) : productData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-8 w-8 text-fog mb-3" />
              <p className="text-sm font-medium text-midnight">Aucun produit</p>
              <p className="text-xs text-fog mt-1">Les données apparaitront ici après les premières commandes.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-silk">
                      <SortableHeader<ProductSortKey> label="Produit" sortKey="productName" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} />
                      <SortableHeader<ProductSortKey> label="Catégorie" sortKey="productCategory" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} />
                      <SortableHeader<ProductSortKey> label="Commandes" sortKey="totalOrders" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                      <SortableHeader<ProductSortKey> label="Livrées" sortKey="deliveredOrders" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                      <SortableHeader<ProductSortKey> label="Retours" sortKey="returnedOrders" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                      <SortableHeader<ProductSortKey> label="Taux RTO" sortKey="rtoRate" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                      <SortableHeader<ProductSortKey> label="CA Total" sortKey="totalRevenue" currentSort={productSort} currentDir={productSortDir} onSort={handleProductSort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((p) => (
                      <tr key={p.id} className="border-b border-silk/50 transition-colors hover:bg-snow/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-midnight">{p.productName}</span>
                            <ProductRiskBadge rtoRate={p.rtoRate} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-fog">{p.productCategory}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-slate">{p.totalOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-mint-deep">{p.deliveredOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-rose">{p.returnedOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RtoBar value={Math.round(p.rtoRate * 100)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm font-semibold text-midnight">
                            {p.totalRevenue.toLocaleString("fr-FR")} <span className="text-xs font-normal text-fog">DH</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {sortedProducts.map((p) => (
                  <div key={p.id} className="rounded-sm border border-silk bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-body text-sm font-semibold text-midnight">{p.productName}</p>
                        <p className="text-xs text-fog mt-0.5">{p.productCategory}</p>
                      </div>
                      <ProductRiskBadge rtoRate={p.rtoRate} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-fog">Taux RTO</span>
                        <RtoBar value={Math.round(p.rtoRate * 100)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-t border-silk pt-3">
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Commandes</p>
                        <p className="font-mono text-sm font-bold text-slate">{p.totalOrders}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Livrées</p>
                        <p className="font-mono text-sm font-bold text-mint-deep">{p.deliveredOrders}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Retours</p>
                        <p className="font-mono text-sm font-bold text-rose">{p.returnedOrders}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[11px] text-fog">CA</p>
                        <p className="font-mono text-sm font-bold text-midnight">{p.totalRevenue.toLocaleString("fr-FR")} <span className="text-[11px] font-normal text-fog">DH</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ 4. CITY ANALYSIS TABLE ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analyse par ville</CardTitle>
              <p className="text-xs text-fog">Performance par zone géographique</p>
            </div>
            {!cityLoading && !cityError && cityData.length > 0 && (
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium",
                cityData.some((c) => c.riskTier !== "unknown")
                  ? "bg-mint-bg text-mint-deep"
                  : "bg-snow text-fog"
              )}>
                {cityData.some((c) => c.riskTier !== "unknown") ? "Données réelles" : "Estimation"}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {cityLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : cityError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-rose mb-3" />
              <p className="text-sm font-medium text-midnight">Erreur de chargement</p>
              <p className="text-xs text-fog mt-1">{cityError}</p>
            </div>
          ) : cityData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-8 w-8 text-fog mb-3" />
              <p className="text-sm font-medium text-midnight">Aucune donnée de ville</p>
              <p className="text-xs text-fog mt-1">Les données apparaitront ici après les premières commandes.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-silk">
                      <SortableHeader<CitySortKey> label="Ville" sortKey="cityDisplay" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} />
                      <SortableHeader<CitySortKey> label="Commandes" sortKey="totalOrders" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                      <SortableHeader<CitySortKey> label="Livrées" sortKey="deliveredOrders" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                      <SortableHeader<CitySortKey> label="Retours" sortKey="returnedOrders" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                      <SortableHeader<CitySortKey> label="Taux RTO" sortKey="rtoRate" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                      <SortableHeader<CitySortKey> label="Score moyen" sortKey="avgScore" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                      <SortableHeader<CitySortKey> label="Risque" sortKey="riskTier" currentSort={citySort} currentDir={citySortDir} onSort={handleCitySort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCities.map((c) => (
                      <tr key={c.id} className="border-b border-silk/50 transition-colors hover:bg-snow/30">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-midnight">{c.cityDisplay}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-slate">{c.totalOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-mint-deep">{c.deliveredOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-rose">{c.returnedOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RtoBar value={Math.round(c.rtoRate * 100)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                              c.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                              c.avgScore > 30 && c.avgScore <= 65 && "bg-amber-bg text-amber",
                              c.avgScore > 65 && c.avgScore <= 85 && "bg-rose-bg text-rose",
                              c.avgScore > 85 && "bg-violet-bg text-violet"
                            )}
                          >
                            {c.avgScore}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RiskTierBadge tier={c.riskTier} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {sortedCities.map((c) => (
                  <div key={c.id} className="rounded-sm border border-silk bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-body text-sm font-semibold text-midnight">{c.cityDisplay}</p>
                      <RiskTierBadge tier={c.riskTier} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-fog">Taux RTO</span>
                        <RtoBar value={Math.round(c.rtoRate * 100)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-t border-silk pt-3">
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Commandes</p>
                        <p className="font-mono text-sm font-bold text-slate">{c.totalOrders}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Livrées</p>
                        <p className="font-mono text-sm font-bold text-mint-deep">{c.deliveredOrders}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Retours</p>
                        <p className="font-mono text-sm font-bold text-rose">{c.returnedOrders}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[11px] text-fog">Score</p>
                        <span
                          className={cn(
                            "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                            c.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                            c.avgScore > 30 && c.avgScore <= 65 && "bg-amber-bg text-amber",
                            c.avgScore > 65 && c.avgScore <= 85 && "bg-rose-bg text-rose",
                            c.avgScore > 85 && "bg-violet-bg text-violet"
                          )}
                        >
                          {c.avgScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ 4b. ZONE (QUARTIER) ANALYSIS ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-ocean" />
                <CardTitle>Analyse par quartier</CardTitle>
              </div>
              <p className="text-xs text-fog mt-1">
                Score géographique auto-ajusté · Plus précis que la ville
              </p>
            </div>
            {/* City filter */}
            {!zoneLoading && zoneCities.length > 0 && (
              <select
                value={zoneCityFilter}
                onChange={(e) => setZoneCityFilter(e.target.value)}
                className="rounded-sm border border-silk bg-white px-3 py-2 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint min-h-[44px]"
              >
                <option value="">Toutes les villes</option>
                {zoneCities.map((city) => (
                  <option key={city} value={city}>{capitalize(city)}</option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* ── Zone mini KPIs ── */}
          {zoneLoading ? (
            <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[200px] snap-start lg:min-w-0 h-20 animate-pulse rounded-xl bg-snow" />
              ))}
            </div>
          ) : zoneError ? null : (
            <div className="mb-6 flex gap-3 overflow-x-auto no-scrollbar snap-x-mandatory pb-2 -mx-4 px-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0 lg:pb-0 lg:overflow-visible">
              <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ocean" />
                  <p className="text-xs font-medium text-fog">Quartiers trackés</p>
                </div>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {zoneData.length}
                </p>
                <p className="text-[11px] text-fog">
                  zones avec données suffisantes
                </p>
              </div>

              <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose" />
                  <p className="text-xs font-medium text-fog">Quartiers critiques</p>
                </div>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {criticalZones}
                </p>
                <p className="text-[11px] text-fog">
                  RTO &gt; 35%
                </p>
              </div>

              <div className="min-w-[200px] snap-start lg:min-w-0 rounded-xl border border-silk bg-snow/50 p-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-mint-deep" />
                  <p className="text-xs font-medium text-fog">Quartiers fiables</p>
                </div>
                <p className="mt-2 font-display text-xl font-bold text-midnight">
                  {safeZones}
                </p>
                <p className="text-[11px] text-fog">
                  RTO &lt; 15%, min 5 commandes
                </p>
              </div>
            </div>
          )}

          {/* ── Zone table ── */}
          {zoneLoading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : zoneError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-rose mb-3" />
              <p className="text-sm font-medium text-midnight">Erreur de chargement</p>
              <p className="text-xs text-fog mt-1">{zoneError}</p>
            </div>
          ) : zoneData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-8 w-8 text-fog mb-3" />
              <p className="text-sm font-medium text-midnight">Aucune donnée de quartier</p>
              <p className="text-xs text-fog mt-1">Les données apparaitront ici après les premières commandes avec adresse détaillée.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-silk">
                      <SortableHeader<ZoneSortKey> label="Ville" sortKey="city" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} />
                      <SortableHeader<ZoneSortKey> label="Quartier" sortKey="zone" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} />
                      <SortableHeader<ZoneSortKey> label="Commandes" sortKey="totalOrders" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                      <SortableHeader<ZoneSortKey> label="Livrées" sortKey="deliveredOrders" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                      <SortableHeader<ZoneSortKey> label="Retours" sortKey="returnedOrders" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                      <SortableHeader<ZoneSortKey> label="Taux RTO" sortKey="rtoRate" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                      <SortableHeader<ZoneSortKey> label="Score moyen" sortKey="avgScore" currentSort={zoneSort} currentDir={zoneSortDir} onSort={handleZoneSort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedZones.map((z) => (
                      <tr key={z.id} className="border-b border-silk/50 transition-colors hover:bg-snow/30">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-midnight">{capitalize(z.city)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate">{capitalize(z.zone)}</span>
                            <ZoneRiskBadge rtoRate={z.rtoRate} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-slate">{z.totalOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-mint-deep">{z.deliveredOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-rose">{z.returnedOrders}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RtoBar value={Math.round(z.rtoRate * 100)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                              z.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                              z.avgScore > 30 && z.avgScore <= 65 && "bg-amber-bg text-amber",
                              z.avgScore > 65 && z.avgScore <= 85 && "bg-rose-bg text-rose",
                              z.avgScore > 85 && "bg-violet-bg text-violet"
                            )}
                          >
                            {Math.round(z.avgScore)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {sortedZones.map((z) => (
                  <div key={z.id} className="rounded-sm border border-silk bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-body text-sm font-semibold text-midnight">{capitalize(z.zone)}</p>
                        <p className="text-xs text-fog mt-0.5">{capitalize(z.city)}</p>
                      </div>
                      <ZoneRiskBadge rtoRate={z.rtoRate} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-fog">Taux RTO</span>
                        <RtoBar value={Math.round(z.rtoRate * 100)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border-t border-silk pt-3">
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Commandes</p>
                        <p className="font-mono text-sm font-bold text-slate">{z.totalOrders}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Livrées</p>
                        <p className="font-mono text-sm font-bold text-mint-deep">{z.deliveredOrders}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-fog">Retours</p>
                        <p className="font-mono text-sm font-bold text-rose">{z.returnedOrders}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[11px] text-fog">Score</p>
                        <span
                          className={cn(
                            "inline-flex rounded-xs px-2 py-0.5 font-mono text-xs font-bold",
                            z.avgScore <= 30 && "bg-mint-bg text-mint-deep",
                            z.avgScore > 30 && z.avgScore <= 65 && "bg-amber-bg text-amber",
                            z.avgScore > 65 && z.avgScore <= 85 && "bg-rose-bg text-rose",
                            z.avgScore > 85 && "bg-violet-bg text-violet"
                          )}
                        >
                          {Math.round(z.avgScore)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ 5. HOURLY PATTERNS ═══ */}
      <Card className="rounded-[18px]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-fog" />
              Patterns temporels
            </CardTitle>
            <p className="mt-1 text-xs text-fog">
              Volume de commandes et taux de risque par heure — les commandes nocturnes (1h-5h) sont 2× plus risquées
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="orders"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="risk"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#64748B" }}
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
                      fill={entry.hourNum >= 1 && entry.hourNum <= 5 ? "#F43F5E" : "#3B82F6"}
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
                      fill={entry.hourNum >= 1 && entry.hourNum <= 5 ? "#F43F5E" : "#94A3B8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-silk pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-ocean/70" />
              <span className="text-xs text-fog">Commandes (jour)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-rose/70" />
              <span className="text-xs text-fog">Commandes (nuit 1h-5h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded-full bg-mist/25" />
              <span className="text-xs text-fog">Taux de risque (%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
