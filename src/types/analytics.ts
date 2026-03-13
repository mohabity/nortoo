// ── Analytics API response types ──

export interface SavingsApiData {
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
  // WoW deltas for all KPIs
  rtoRate: number;
  rtoRateDelta: number;
  deliveryRate: number;
  deliveryRateDelta: number;
  deliveredCount: number;
  roiDelta: number | null;
  period: { days: number; from: string; to: string };
}

export interface ProductAnalytics {
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

export interface ProductsApiResponse {
  data: ProductAnalytics[];
  meta: { total: number };
}

export interface ZoneAnalytics {
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

export interface ZonesApiResponse {
  data: ZoneAnalytics[];
  meta: { total: number; highRiskZones: number };
}

export interface CityAnalytics {
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

export interface CitiesApiResponse {
  data: CityAnalytics[];
  meta: { total: number };
}

export type Period = "7j" | "30j" | "90j";

export type CitySortKey = "cityDisplay" | "totalOrders" | "deliveredOrders" | "returnedOrders" | "rtoRate" | "avgScore" | "riskTier";
export type ProductSortKey = "productName" | "productCategory" | "totalOrders" | "deliveredOrders" | "returnedOrders" | "rtoRate" | "totalRevenue";
export type ZoneSortKey = "city" | "zone" | "totalOrders" | "deliveredOrders" | "returnedOrders" | "rtoRate" | "avgScore";
export type SortDir = "asc" | "desc";
