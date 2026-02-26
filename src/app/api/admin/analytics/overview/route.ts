import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { dailyMetrics } from "@/db/schema";
import { and, gte, isNull, desc } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/overview?range=7d|30d|90d
 * Returns platform-wide KPIs + daily time series from dailyMetrics (global rows).
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = request.nextUrl.searchParams.get("range") ?? "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  // Fetch global daily metrics (merchantId IS NULL)
  const rows = await db
    .select()
    .from(dailyMetrics)
    .where(
      and(isNull(dailyMetrics.merchantId), gte(dailyMetrics.date, sinceStr))
    )
    .orderBy(desc(dailyMetrics.date));

  // Aggregate KPIs
  let totalOrders = 0;
  let totalScored = 0;
  let totalConfirmed = 0;
  let totalRejected = 0;
  let latestMrr = 0;
  let latestActiveMerchants = 0;
  let scoreSum = 0;

  for (const row of rows) {
    totalOrders += row.ordersReceived;
    totalScored += row.ordersScored;
    totalConfirmed += row.ordersConfirmed;
    totalRejected += row.ordersRejected;
    scoreSum += (row.avgScore ?? 0) * row.ordersReceived;
  }

  // Latest day for MRR + active merchants
  if (rows.length > 0) {
    latestMrr = rows[0].mrrDh;
    latestActiveMerchants = rows[0].activeMerchants;
  }

  const avgScore = totalOrders > 0 ? Math.round(scoreSum / totalOrders) : 0;
  const scoringRate =
    totalOrders > 0 ? Math.round((totalScored / totalOrders) * 100) : 0;

  return NextResponse.json({
    kpis: {
      totalOrders,
      totalScored,
      totalConfirmed,
      totalRejected,
      avgScore,
      scoringRate,
      mrr: latestMrr,
      activeMerchants: latestActiveMerchants,
    },
    series: rows.reverse().map((r) => ({
      date: r.date,
      orders: r.ordersReceived,
      confirmed: r.ordersConfirmed,
      rejected: r.ordersRejected,
      avgScore: r.avgScore,
      mrr: r.mrrDh,
      activeMerchants: r.activeMerchants,
    })),
    range,
  });
}
