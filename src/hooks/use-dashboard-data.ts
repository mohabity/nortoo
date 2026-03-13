"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { OrderRow } from "@/components/dashboard/order-table";
import type { SavingsData, UrgentOrder, StatsData, ChartPoint } from "@/types/dashboard";

export interface DashboardData {
  savings: SavingsData | null;
  stats: StatsData | null;
  chartData: ChartPoint[];
  urgentOrders: UrgentOrder[];
  recentOrders: OrderRow[];
  ordersLoading: boolean;
  refreshing: boolean;
  syncing: boolean;
  fetchAll: () => void;
  handleRefresh: () => Promise<{ synced: number }>;
}

export function useDashboardData(): DashboardData {
  const [savings, setSavings] = useState<SavingsData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [urgentOrders, setUrgentOrders] = useState<UrgentOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const hasSynced = useRef(false);

  const syncYouCan = useCallback(async (): Promise<number> => {
    try {
      setSyncing(true);
      const res = await fetch("/api/sync/youcan", { method: "POST" });
      if (!res.ok) return 0;
      const json = await res.json();
      return json.synced ?? 0;
    } catch {
      return 0;
    } finally {
      setSyncing(false);
    }
  }, []);

  const fetchRecentOrders = useCallback(() => {
    setOrdersLoading(true);
    fetch("/api/orders?per_page=5&page=1")
      .then((r) => r.json())
      .then((d) => { if (d.data) setRecentOrders(d.data); })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  const fetchUrgent = useCallback(() => {
    fetch("/api/dashboard/urgent")
      .then((r) => r.json())
      .then((d) => { if (d.data) setUrgentOrders(d.data); })
      .catch(() => {});
  }, []);

  const fetchStats = useCallback(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.data) setStats(d.data); })
      .catch(() => {});
  }, []);

  const fetchChart = useCallback(() => {
    fetch("/api/dashboard/chart")
      .then((r) => r.json())
      .then((d) => { if (d.data) setChartData(d.data); })
      .catch(() => {});
  }, []);

  const fetchSavings = useCallback(() => {
    fetch("/api/dashboard/savings?period=30d")
      .then((r) => r.json())
      .then((d) => { if (d.data) setSavings(d.data); })
      .catch(() => {});
  }, []);

  const fetchAll = useCallback(() => {
    fetchRecentOrders();
    fetchUrgent();
    fetchStats();
    fetchChart();
    fetchSavings();
  }, [fetchRecentOrders, fetchUrgent, fetchStats, fetchChart, fetchSavings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const synced = await syncYouCan();
      fetchAll();
      return { synced };
    } finally {
      setRefreshing(false);
    }
  }, [syncYouCan, fetchAll]);

  // Initial load + poll urgent every 60s
  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchUrgent, 60000);
    return () => clearInterval(iv);
  }, [fetchAll, fetchUrgent]);

  // Auto-sync YouCan on first load
  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;
    syncYouCan().then((synced) => {
      if (synced > 0) fetchAll();
    });
  }, [syncYouCan, fetchAll]);

  return {
    savings,
    stats,
    chartData,
    urgentOrders,
    recentOrders,
    ordersLoading,
    refreshing,
    syncing,
    fetchAll,
    handleRefresh,
  };
}
