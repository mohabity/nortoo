import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { eq, and, gte, lt, count, avg, sql } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/stats
 * Returns real KPIs for the current merchant from the orders table.
 */
export async function GET() {
  const merchantId = await getMerchantId();

  // Date boundaries (UTC)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Run all queries in parallel
  const [
    totalResult,
    todayResult,
    yesterdayResult,
    avgScoreResult,
    blockedTodayResult,
    deliveryResult,
  ] = await Promise.all([
    // Total orders
    db
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.merchantId, merchantId)),

    // Orders today
    db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          gte(orders.createdAt, todayStart)
        )
      ),

    // Orders yesterday (for change calculation)
    db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          gte(orders.createdAt, yesterdayStart),
          lt(orders.createdAt, todayStart)
        )
      ),

    // Average fraud score
    db
      .select({ value: avg(orders.fraudScore) })
      .from(orders)
      .where(eq(orders.merchantId, merchantId)),

    // Blocked today
    db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.decision, "block"),
          gte(orders.createdAt, todayStart)
        )
      ),

    // Delivery stats: delivered vs resolved (delivered + returned)
    db
      .select({
        delivered: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')`,
        resolved: sql<number>`count(*) filter (where ${orders.deliveryStatus} in ('delivered', 'returned'))`,
      })
      .from(orders)
      .where(eq(orders.merchantId, merchantId)),
  ]);

  const totalOrders = totalResult[0]?.value ?? 0;
  const ordersToday = todayResult[0]?.value ?? 0;
  const ordersYesterday = yesterdayResult[0]?.value ?? 0;
  const avgScore = Math.round(Number(avgScoreResult[0]?.value ?? 0));
  const blockedCount = blockedTodayResult[0]?.value ?? 0;

  const delivered = deliveryResult[0]?.delivered ?? 0;
  const resolved = deliveryResult[0]?.resolved ?? 0;
  const deliveryRate = resolved > 0 ? Math.round((delivered / resolved) * 100) : 0;

  // Calculate change vs yesterday
  let ordersTodayChange = "";
  if (ordersYesterday === 0) {
    ordersTodayChange = ordersToday > 0 ? `+${ordersToday}` : "0";
  } else {
    const pct = Math.round(((ordersToday - ordersYesterday) / ordersYesterday) * 100);
    ordersTodayChange = `${pct >= 0 ? "+" : ""}${pct}% vs hier`;
  }

  return NextResponse.json({
    data: {
      ordersToday,
      ordersTodayChange,
      avgScore,
      deliveryRate,
      blockedCount,
      totalOrders,
    },
  });
}
