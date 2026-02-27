import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, orders, invoices, auditLogs } from "@/db/schema";
import { count, eq, sql, gte, lte, and, desc, isNotNull } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { PLAN_CONFIGS, type PlanId } from "@/lib/plans";

/**
 * GET /api/nrt-panel/overview
 * Platform-level KPIs for the admin dashboard.
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Dates for alerts (trials expiring within 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const [
      totalResult,
      planCounts,
      billingCounts,
      orders30dResult,
      blocked30dResult,
      topMerchants,
      mrrHistory,
      recentActivity,
      expiringTrials,
      pendingDowngrades,
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

      // 7. MRR history — paid invoices grouped by month (last 6 months)
      db
        .select({
          month: invoices.period,
          total: sql<number>`SUM(${invoices.amountTTC})`,
        })
        .from(invoices)
        .where(eq(invoices.status, "paid"))
        .groupBy(invoices.period)
        .orderBy(desc(invoices.period))
        .limit(6),

      // 8. Recent admin activity (last 10 actions)
      db
        .select({
          id: auditLogs.id,
          actor: auditLogs.actor,
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
          details: auditLogs.details,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(10),

      // 9. Trials expiring within 3 days
      db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email,
          trialEndsAt: merchants.trialEndsAt,
        })
        .from(merchants)
        .where(
          and(
            eq(merchants.billingStatus, "trial"),
            lte(merchants.trialEndsAt, threeDaysFromNow),
            gte(merchants.trialEndsAt, new Date())
          )
        )
        .orderBy(merchants.trialEndsAt),

      // 10. Pending plan downgrades
      db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email,
          plan: merchants.plan,
          pendingPlanDowngrade: merchants.pendingPlanDowngrade,
        })
        .from(merchants)
        .where(isNotNull(merchants.pendingPlanDowngrade)),
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
        mrrHistory: mrrHistory.reverse().map((r) => ({
          month: r.month,
          total: Number(r.total ?? 0) / 100, // centimes → DH
        })),
        recentActivity,
        expiringTrials,
        pendingDowngrades,
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
