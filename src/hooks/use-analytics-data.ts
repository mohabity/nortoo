"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";
import type {
  SavingsApiData,
  CityAnalytics,
  CitiesApiResponse,
  CitySortKey,
  ProductAnalytics,
  ProductsApiResponse,
  ProductSortKey,
  ZoneAnalytics,
  ZonesApiResponse,
  ZoneSortKey,
  SortDir,
  Period,
} from "@/types/analytics";
import { DAILY_DATA_90, scoreDistributionBase, decisionDataBase } from "@/app/dashboard/analytics/_components/constants";

export function useAnalyticsData() {
  const { t, locale } = useTranslation();
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

  // ── PDF report state ──
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDropdownOpen, setPdfDropdownOpen] = useState(false);

  const pdfMonths = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1 - i);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: formatDate(d, locale, { month: "long", year: "numeric" }),
      };
    });
  }, [locale]);

  async function handleDownloadPDF(month: string) {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert((json as { error?: string }).error ?? t("analytics.export.reportError"));
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nortoo-rapport-${month}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
      setPdfDropdownOpen(false);
    }
  }

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
        if (!res.ok) throw new Error(`${t("common.error")} ${res.status}`);
        return res.json() as Promise<CitiesApiResponse>;
      })
      .then((json) => {
        setCityData(json.data);
      })
      .catch((err) => {
        setCityError(err instanceof Error ? err.message : t("analytics.products.loadError"));
      })
      .finally(() => {
        setCityLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch product data ──
  useEffect(() => {
    setProductLoading(true);
    setProductError(null);
    fetch("/api/analytics/products")
      .then((res) => {
        if (!res.ok) throw new Error(`${t("common.error")} ${res.status}`);
        return res.json() as Promise<ProductsApiResponse>;
      })
      .then((json) => {
        setProductData(json.data);
      })
      .catch((err) => {
        setProductError(err instanceof Error ? err.message : t("analytics.products.loadError"));
      })
      .finally(() => {
        setProductLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch zone data ──
  useEffect(() => {
    setZoneLoading(true);
    setZoneError(null);
    const params = new URLSearchParams();
    if (zoneCityFilter) params.set("city", zoneCityFilter);
    fetch(`/api/analytics/zones?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${t("common.error")} ${res.status}`);
        return res.json() as Promise<ZonesApiResponse>;
      })
      .then((json) => {
        setZoneData(json.data);
      })
      .catch((err) => {
        setZoneError(err instanceof Error ? err.message : t("analytics.products.loadError"));
      })
      .finally(() => {
        setZoneLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneCityFilter]);

  // Filter daily data by period and format dates with locale
  const dailyData = useMemo(() => {
    const days = period === "7j" ? 7 : period === "30j" ? 30 : 90;
    return DAILY_DATA_90.slice(-days).map((d) => ({
      ...d,
      date: formatDate(d.rawDate, locale, { day: "2-digit", month: "short" }),
      fullDate: formatDate(d.rawDate, locale, { day: "2-digit", month: "long", year: "numeric" }),
    }));
  }, [period, locale]);

  // Resolve translated labels for score distribution
  const scoreDistribution = useMemo(
    () => scoreDistributionBase.map((s) => ({ ...s, label: t(s.labelKey) })),
    [t]
  );

  // Resolve translated labels for decision breakdown
  const decisionData = useMemo(
    () => decisionDataBase.map((d) => ({ ...d, name: t(d.nameKey) })),
    [t]
  );

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
  const roiDisplay = savingsData?.roiMultiple ? `${savingsData.roiMultiple}\u00d7` : "\u2014";

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
        alert(json.error ?? t("analytics.export.error"));
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

  return {
    // Period
    period,
    setPeriod,

    // Savings
    savingsData,
    savingsLoading,
    savings,
    savingsChange,
    roiDisplay,

    // KPIs
    rtoRate,
    rtoDelta,
    baseline,
    deliveryRate,
    totalDelivered,

    // Chart data
    dailyData,
    scoreDistribution,
    decisionData,

    // Cities
    cityData,
    sortedCities,
    cityLoading,
    cityError,
    citySort,
    citySortDir,
    handleCitySort,

    // Products
    productData,
    sortedProducts,
    productLoading,
    productError,
    productSort,
    productSortDir,
    handleProductSort,
    highRiskProducts,
    revenueAtRisk,
    top3RtoConcentration,

    // Zones
    zoneData,
    sortedZones,
    zoneLoading,
    zoneError,
    zoneSort,
    zoneSortDir,
    handleZoneSort,
    zoneCities,
    zoneCityFilter,
    setZoneCityFilter,
    criticalZones,
    safeZones,

    // Export
    exportLoading,
    handleExportAnalytics,

    // PDF
    pdfLoading,
    pdfDropdownOpen,
    setPdfDropdownOpen,
    pdfMonths,
    handleDownloadPDF,
  };
}
