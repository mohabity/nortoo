// ── Dashboard types (shared across dashboard page and components) ──

/** Savings KPI data from GET /api/dashboard/savings */
export interface SavingsData {
  totalSaved: number;
  ordersSaved: number;
  avgSavedPerOrder: number;
  projectedMonthlySaved: number;
  roiMultiple: number | null;
  deltaPercent: number;
}

/** Urgent order needing review (dashboard widget) */
export interface UrgentOrder {
  id: number;
  externalRef: string | null;
  customerName: string | null;
  total: number;
  fraudScore: number;
  decision: string;
  pipelineStatus: string;
  reviewDeadline: string | null;
  escalationPriority: number | null;
}

/** KPI stats from GET /api/stats */
export interface StatsData {
  totalOrders: number;
  avgScore: number;
  deliveryRate: number;
  blockedCount: number;
  ordersToday: number;
  changeScore?: number;
  changeDelivery?: number;
}

/** Single data point for area chart */
export interface ChartPoint {
  date: string;
  commandes: number;
  score: number;
}
