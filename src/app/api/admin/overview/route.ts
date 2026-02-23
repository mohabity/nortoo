import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, orders } from "@/db/schema";
import { count, eq, sql, gte, and, desc } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { PLAN_CONFIGS, type PlanId } from "@/lib/plans";

/**
 * GET /api/admin/overview
 * Platform-level KPIs for the admin dashboard.
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalResult,
      planCounts,
      billingCounts,
      orders30dResult,
      blocked30dResult,
      topMerchants,
    ] = await Promise.all([
      // 1. Total merchants
      db.select({ total: count() }).from(merchants),

      // 2. Merchants by plan
      db
        .select({
          plan: merchants.plan,
          count: count(),
        })
        .from(merchants)
        .groupBy(merchants.plan),

      // 3. Merchants by billing status
      db
        .select({
          status: merchants.billingStatus,
          count: count(),
        })
        .from(merchants)
        .groupBy(merchants.billingStatus),

      // 4. Orders in last 30 days (non-test)
      db
        .select({ total: count() })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, thirtyDaysAgo),
            eq(orders.isTest, false)
          )
        ),

      // 5. Blocked orders in last 30 days
      db
        .select({ total: count() })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, thirtyDaysAgo),
            eq(orders.isTest, false),
            eq(orders.decision, "block")
          )
        ),

      // 6. Top 10 merchants by current month volume
      db
        .select({
          id: merchants.id,
          name: merchants.name,
          plan: merchants.plan,
          billingStatus: merchants.billingStatus,
          currentMonthOrders: merchants.currentMonthOrders,
        })
        .from(merchants)
        .orderBy(desc(merchants.currentMonthOrders))
        .limit(10),
    ]);

    // Aggregate plan counts into a record
    const planCountsMap: Record<string, number> = {};
    for (const row of planCounts) {
      planCountsMap[row.plan] = row.count;
    }

    // Aggregate billing status counts into a record
    const billingCountsMap: Record<string, number> = {};
    for (const row of billingCounts) {
      billingCountsMap[row.status] = row.count;
    }

    // Calculate MRR from paying merchants × plan price
    let mrr = 0;
    for (const planId of Object.keys(PLAN_CONFIGS) as PlanId[]) {
      if (planId === "trial") continue;
      const planCount = planCountsMap[planId] ?? 0;
      mrr += planCount * PLAN_CONFIGS[planId].price;
    }

    const totalMerchants = totalResult[0]?.total ?? 0;
    const trialMerchants = planCountsMap["trial"] ?? 0;
    const payingMerchants = totalMerchants - trialMerchants;
    const orders30d = orders30dResult[0]?.total ?? 0;
    const blocked30d = blocked30dResult[0]?.total ?? 0;

    return NextResponse.json({
      data: {
        totalMerchants,
        trialMerchants,
        payingMerchants,
        activeMerchants: billingCountsMap["active"] ?? 0,
        mrr,
        arr: mrr * 12,
        orders30d,
        blocked30d,
        planCounts: planCountsMap,
        billingCounts: billingCountsMap,
        topMerchants,
      },
    });
  } catch (err) {
    console.error("[Admin Overview] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
