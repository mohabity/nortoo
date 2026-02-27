import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, orders, usageLogs } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";

/**
 * GET /api/nrt-panel/merchants/[id]
 * Detailed merchant view for admin panel.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const merchantId = parseInt(id, 10);
    if (isNaN(merchantId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Fetch merchant (exclude sensitive fields)
    const [merchant] = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        domain: merchants.domain,
        email: merchants.email,
        youcanStoreId: merchants.youcanStoreId,
        youcanStoreName: merchants.youcanStoreName,
        plan: merchants.plan,
        billingStatus: merchants.billingStatus,
        trialEndsAt: merchants.trialEndsAt,
        currentMonthOrders: merchants.currentMonthOrders,
        currentMonthStart: merchants.currentMonthStart,
        verifyThreshold: merchants.verifyThreshold,
        flagThreshold: merchants.flagThreshold,
        blockThreshold: merchants.blockThreshold,
        pendingPlanDowngrade: merchants.pendingPlanDowngrade,
        createdAt: merchants.createdAt,
        updatedAt: merchants.updatedAt,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Parallel queries for related data
    const [recentOrders, usage, totalOrdersResult] = await Promise.all([
      // Recent 10 orders
      db
        .select({
          id: orders.id,
          externalRef: orders.externalRef,
          total: orders.total,
          fraudScore: orders.fraudScore,
          decision: orders.decision,
          deliveryStatus: orders.deliveryStatus,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.merchantId, merchantId))
        .orderBy(desc(orders.createdAt))
        .limit(10),

      // Usage history (last 6 months)
      db
        .select({
          month: usageLogs.month,
          ordersScored: usageLogs.ordersScored,
          ordersBlocked: usageLogs.ordersBlocked,
          totalValue: usageLogs.totalValue,
          blockedValue: usageLogs.blockedValue,
        })
        .from(usageLogs)
        .where(eq(usageLogs.merchantId, merchantId))
        .orderBy(desc(usageLogs.month))
        .limit(6),

      // Total orders count
      db
        .select({ total: count() })
        .from(orders)
        .where(eq(orders.merchantId, merchantId)),
    ]);

    return NextResponse.json({
      data: {
        merchant,
        recentOrders,
        usage,
        totalOrders: totalOrdersResult[0]?.total ?? 0,
      },
    });
  } catch (err) {
    console.error("[Admin Merchant Detail] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
