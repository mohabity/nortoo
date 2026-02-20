import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { cityStats } from "@/db/schema";
import { eq, and, gte, desc, asc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/analytics/cities
 * Returns city stats sorted by RTO rate (or other criteria).
 * Query params:
 *   sort = rto_rate | total_orders | avg_score (default: rto_rate)
 *   order = desc | asc (default: desc)
 *   limit = number (default: 30)
 *   min_orders = number (default: 3)
 */
export async function GET(request: Request) {
  const merchantId = await getMerchantId();
  const url = new URL(request.url);

  const sortField = url.searchParams.get("sort") || "rto_rate";
  const sortOrder = url.searchParams.get("order") || "desc";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 100);
  const minOrders = parseInt(url.searchParams.get("min_orders") || "3", 10);

  // Map sort field to column
  const sortColumn =
    sortField === "total_orders" ? cityStats.totalOrders :
    sortField === "avg_score" ? cityStats.avgScore :
    cityStats.rtoRate;

  const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const cities = await db
    .select({
      id: cityStats.id,
      cityNormalized: cityStats.cityNormalized,
      cityDisplay: cityStats.cityDisplay,
      totalOrders: cityStats.totalOrders,
      deliveredOrders: cityStats.deliveredOrders,
      returnedOrders: cityStats.returnedOrders,
      cancelledOrders: cityStats.cancelledOrders,
      rtoRate: cityStats.rtoRate,
      avgScore: cityStats.avgScore,
      avgOrderValue: cityStats.avgOrderValue,
      riskTier: cityStats.riskTier,
      lastOrderAt: cityStats.lastOrderAt,
    })
    .from(cityStats)
    .where(
      and(
        eq(cityStats.merchantId, merchantId),
        gte(cityStats.totalOrders, minOrders)
      )
    )
    .orderBy(orderBy)
    .limit(limit);

  return NextResponse.json({
    data: cities,
    meta: { total: cities.length },
  });
}
