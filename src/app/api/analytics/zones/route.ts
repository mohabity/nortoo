import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { zoneStats } from "@/db/schema";
import { eq, and, gte, desc, asc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/analytics/zones
 * Returns zone (quartier) stats sorted by RTO rate (or other criteria).
 * Query params:
 *   city = string (optional — filter by city)
 *   sort = rto_rate | total_orders | avg_score (default: rto_rate)
 *   order = desc | asc (default: desc)
 *   limit = number (default: 50)
 *   min_orders = number (default: 3)
 */
export async function GET(request: Request) {
  const merchantId = await getMerchantId();
  const url = new URL(request.url);

  const cityFilter = url.searchParams.get("city")?.toLowerCase().trim() || null;
  const sortField = url.searchParams.get("sort") || "rto_rate";
  const sortOrder = url.searchParams.get("order") || "desc";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const minOrders = parseInt(url.searchParams.get("min_orders") || "3", 10);

  // Map sort field to column
  const sortColumn =
    sortField === "total_orders" ? zoneStats.totalOrders :
    sortField === "avg_score" ? zoneStats.avgScore :
    zoneStats.rtoRate;

  const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  // Build where conditions
  const conditions = [
    eq(zoneStats.merchantId, merchantId),
    gte(zoneStats.totalOrders, minOrders),
  ];

  if (cityFilter) {
    conditions.push(eq(zoneStats.city, cityFilter));
  }

  const zones = await db
    .select({
      id: zoneStats.id,
      city: zoneStats.city,
      zone: zoneStats.zone,
      postalCode: zoneStats.postalCode,
      totalOrders: zoneStats.totalOrders,
      deliveredOrders: zoneStats.deliveredOrders,
      returnedOrders: zoneStats.returnedOrders,
      blockedOrders: zoneStats.blockedOrders,
      rtoRate: zoneStats.rtoRate,
      avgScore: zoneStats.avgScore,
      avgDeliveryAttempts: zoneStats.avgDeliveryAttempts,
      lastOrderAt: zoneStats.lastOrderAt,
    })
    .from(zoneStats)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit);

  // Compute meta
  const highRiskZones = zones.filter((z) => z.rtoRate > 0.30).length;

  return NextResponse.json({
    data: zones,
    meta: {
      total: zones.length,
      highRiskZones,
    },
  });
}
