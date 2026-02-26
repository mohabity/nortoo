import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { dailyMetrics } from "@/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { requirePermission, handlePermissionError } from "@/lib/permissions";

/**
 * GET /api/dashboard/daily-metrics?range=7d|30d|90d
 * Returns daily metrics for the authenticated merchant.
 */
export async function GET(request: NextRequest) {
  let merchantId: number;
  try {
    const ctx = await requirePermission("analytics:read");
    merchantId = ctx.merchantId;
  } catch (err) {
    try {
      return handlePermissionError(err);
    } catch {
      return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
  }

  const range = request.nextUrl.searchParams.get("range") ?? "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(dailyMetrics)
    .where(
      and(eq(dailyMetrics.merchantId, merchantId), gte(dailyMetrics.date, sinceStr))
    )
    .orderBy(desc(dailyMetrics.date));

  return NextResponse.json({
    data: rows.reverse().map((r) => ({
      date: r.date,
      ordersReceived: r.ordersReceived,
      ordersScored: r.ordersScored,
      ordersConfirmed: r.ordersConfirmed,
      ordersRejected: r.ordersRejected,
      ordersShipped: r.ordersShipped,
      ordersDelivered: r.ordersDelivered,
      ordersReturned: r.ordersReturned,
      avgScore: r.avgScore,
      scoreLow: r.scoreLow,
      scoreMedium: r.scoreMedium,
      scoreHigh: r.scoreHigh,
    })),
    range,
  });
}
