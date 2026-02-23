import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, usageLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { getPlanConfig, trialDaysRemaining } from "@/lib/plans";
import { checkQuota } from "@/lib/quota";

/**
 * GET /api/billing
 *
 * Returns complete billing state for the dashboard:
 * - plan: current plan config (id, name, price, features)
 * - billing: status, trialEndsAt, daysRemaining
 * - usage: current month orders, limit, percent
 * - history: last 6 months of usage logs
 */
export async function GET() {
  try {
    const merchantId = await getMerchantId();

    // Fetch merchant billing data
    const [m] = await db
      .select({
        plan: merchants.plan,
        billingStatus: merchants.billingStatus,
        trialEndsAt: merchants.trialEndsAt,
        currentMonthOrders: merchants.currentMonthOrders,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!m) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const planConfig = getPlanConfig(m.plan);
    const quota = await checkQuota(merchantId);
    const days = trialDaysRemaining(m.trialEndsAt);

    // Fetch usage history (last 6 months)
    const history = await db
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
      .limit(6);

    return NextResponse.json({
      plan: {
        id: planConfig.id,
        name: planConfig.name,
        price: planConfig.price,
        label: planConfig.label,
        ordersPerMonth: planConfig.ordersPerMonth,
        features: planConfig.features,
      },
      billing: {
        status: m.billingStatus,
        trialEndsAt: m.trialEndsAt?.toISOString() ?? null,
        daysRemaining: days > 0 ? days : null,
      },
      usage: {
        current: quota.current,
        limit: quota.limit,
        percent: quota.limit > 0
          ? Math.min(Math.round((quota.current / quota.limit) * 100), 100)
          : 0,
        allowed: quota.allowed,
        reason: quota.reason ?? null,
      },
      history,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("No authenticated merchant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Billing] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
