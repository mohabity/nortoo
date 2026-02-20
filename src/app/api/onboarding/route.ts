import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, orders } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/onboarding
 * Returns the current onboarding state for the merchant.
 */
export async function GET() {
  const merchantId = await getMerchantId();

  const [merchant] = await db
    .select({
      name: merchants.name,
      youcanStoreId: merchants.youcanStoreId,
      onboardingStep: merchants.onboardingStep,
      onboardingCompletedAt: merchants.onboardingCompletedAt,
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return NextResponse.json({ error: "Marchand introuvable" }, { status: 404 });
  }

  // Count real orders (non-test)
  const [orderCount] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(eq(orders.merchantId, merchantId), eq(orders.isTest, false)));

  // Check if a test order was sent
  const [testCount] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(eq(orders.merchantId, merchantId), eq(orders.isTest, true)));

  return NextResponse.json({
    data: {
      completed: !!merchant.onboardingCompletedAt,
      currentStep: merchant.onboardingStep,
      merchantName: merchant.name,
      storeConnected: !!merchant.youcanStoreId,
      scoringConfigured: merchant.verifyThreshold !== 31 ||
        merchant.flagThreshold !== 66 || merchant.blockThreshold !== 86,
      testOrderSent: (testCount?.count ?? 0) > 0,
      realOrderCount: orderCount?.count ?? 0,
      completedAt: merchant.onboardingCompletedAt,
    },
  });
}
