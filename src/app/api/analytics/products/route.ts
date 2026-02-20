import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { productStats } from "@/db/schema";
import { eq, and, gte, desc, asc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/analytics/products
 * Returns product stats sorted by RTO rate (or other criteria).
 * Query params:
 *   sort = rto_rate | total_orders | total_revenue (default: rto_rate)
 *   order = desc | asc (default: desc)
 *   limit = number (default: 20)
 *   min_orders = number (default: 3)
 */
export async function GET(request: Request) {
  const merchantId = await getMerchantId();
  const url = new URL(request.url);

  const sortField = url.searchParams.get("sort") || "rto_rate";
  const sortOrder = url.searchParams.get("order") || "desc";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const minOrders = parseInt(url.searchParams.get("min_orders") || "3", 10);

  // Map sort field to column
  const sortColumn =
    sortField === "total_orders" ? productStats.totalOrders :
    sortField === "total_revenue" ? productStats.totalRevenue :
    productStats.rtoRate;

  const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const products = await db
    .select({
      id: productStats.id,
      productId: productStats.productId,
      productName: productStats.productName,
      productCategory: productStats.productCategory,
      totalOrders: productStats.totalOrders,
      deliveredOrders: productStats.deliveredOrders,
      returnedOrders: productStats.returnedOrders,
      cancelledOrders: productStats.cancelledOrders,
      rtoRate: productStats.rtoRate,
      avgOrderValue: productStats.avgOrderValue,
      totalRevenue: productStats.totalRevenue,
      lastOrderAt: productStats.lastOrderAt,
    })
    .from(productStats)
    .where(
      and(
        eq(productStats.merchantId, merchantId),
        gte(productStats.totalOrders, minOrders)
      )
    )
    .orderBy(orderBy)
    .limit(limit);

  // Enrich with risk level
  const enriched = products.map((p) => ({
    ...p,
    riskLevel:
      p.rtoRate > 0.30 ? "high" :
      p.rtoRate > 0.15 ? "medium" :
      "low",
  }));

  return NextResponse.json({
    data: enriched,
    meta: { total: enriched.length },
  });
}
