import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import {
  getPlanConfig,
  checkOrderLimit,
  trialDaysRemaining,
  type PlanId,
} from "@/lib/plans";

/**
 * GET /api/settings/plan
 * Returns plan info, usage stats, and trial status for the current merchant.
 * Used by PlanBanner and BillingTab.
 */
export async function GET() {
  const merchantId = await getMerchantId();

  const [merchant] = await db
    .select({
      plan: merchants.plan,
      trialEndsAt: merchants.trialEndsAt,
      currentMonthOrders: merchants.currentMonthOrders,
      currentMonthStart: merchants.currentMonthStart,
      createdAt: merchants.createdAt,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return NextResponse.json({ error: "Marchand introuvable" }, { status: 404 });
  }

  const plan = merchant.plan as PlanId;
  const config = getPlanConfig(plan);
  const orderUsage = checkOrderLimit(plan, merchant.currentMonthOrders);

  // Count active users
  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.merchantId, merchantId));

  // Trial info
  const trial = merchant.trialEndsAt
    ? {
        daysRemaining: trialDaysRemaining(merchant.trialEndsAt),
        expiresAt: merchant.trialEndsAt.toISOString(),
      }
    : null;

  return NextResponse.json({
    data: {
      plan,
      config: {
        name: config.name,
        price: config.price,
        label: config.label,
        ordersPerMonth: config.ordersPerMonth,
        maxUsers: config.maxUsers,
        features: config.features,
      },
      usage: {
        orders: {
          current: orderUsage.current,
          limit: orderUsage.limit,
          percent: orderUsage.percent,
        },
        users: {
          current: userCount?.count ?? 1,
          limit: config.maxUsers,
        },
      },
      trial,
      currentMonthStart: merchant.currentMonthStart?.toISOString() ?? null,
    },
  });
}
