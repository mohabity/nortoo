import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { and, eq, gte, count, avg, sql } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/stats
 *
 * Real-time KPI stats for the dashboard.
 * Returns: totalOrders, avgScore, deliveryRate, blockedCount, ordersToday,
 *          changeScore (vs last week), changeDelivery (vs last month)
 */
export async function GET() {
  try {
    const merchantId = await getMerchantId();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const baseConditions = [
      eq(orders.merchantId, merchantId),
      eq(orders.isTest, false),
    ];

    // Run all queries in parallel
    const [
      totalResult,
      avgScoreResult,
      deliveredResult,
      blockedResult,
      todayResult,
      prevWeekAvgScore,
    ] = await Promise.all([
      // Total orders
      db.select({ count: count() })
        .from(orders)
        .where(and(...baseConditions)),

      // Average fraud score (current week)
      db.select({ avg: avg(orders.fraudScore) })
        .from(orders)
        .where(and(...baseConditions, gte(orders.createdAt, weekAgo))),

      // Delivered orders (for delivery rate)
      db.select({ count: count() })
        .from(orders)
        .where(and(
          ...baseConditions,
          eq(orders.deliveryStatus, "delivered"),
        )),

      // Blocked orders
      db.select({ count: count() })
        .from(orders)
        .where(and(
          ...baseConditions,
          eq(orders.decision, "block"),
        )),

      // Orders today
      db.select({ count: count() })
        .from(orders)
        .where(and(
          ...baseConditions,
          gte(orders.createdAt, todayStart),
        )),

      // Previous week avg score (for comparison)
      db.select({ avg: avg(orders.fraudScore) })
        .from(orders)
        .where(and(
          ...baseConditions,
          gte(orders.createdAt, twoWeeksAgo),
          sql`${orders.createdAt} < ${weekAgo}`,
        )),
    ]);

    const totalOrders = totalResult[0]?.count ?? 0;
    const avgScore = Math.round(Number(avgScoreResult[0]?.avg) || 0);
    const deliveredCount = deliveredResult[0]?.count ?? 0;
    const blockedCount = blockedResult[0]?.count ?? 0;
    const ordersToday = todayResult[0]?.count ?? 0;
    const prevAvgScore = Math.round(Number(prevWeekAvgScore[0]?.avg) || 0);

    // Delivery rate: delivered / (total - pending)
    const deliveryRate = totalOrders > 0
      ? Math.round((deliveredCount / totalOrders) * 100)
      : 0;

    // Change in score vs previous week
    const changeScore = prevAvgScore > 0 ? avgScore - prevAvgScore : undefined;

    return NextResponse.json({
      data: {
        totalOrders,
        avgScore,
        deliveryRate,
        blockedCount,
        ordersToday,
        changeScore,
      },
    });
  } catch (error) {
    console.error("[Stats] Error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
