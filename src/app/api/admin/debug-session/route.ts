import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { orders, merchants } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * GET /api/admin/debug-session
 * Diagnostic: shows which merchant the current session resolves to,
 * and how many orders exist for that merchant.
 */
export async function GET() {
  try {
    // Session info
    const session = await auth();
    const cookieStore = await cookies();
    const legacyCookie = cookieStore.get("nortoo_merchant")?.value;

    const merchantId = session?.user?.merchantId;

    if (!merchantId) {
      return NextResponse.json({
        error: "No merchantId in session",
        session: session ? { user: session.user } : null,
        legacyCookie,
      });
    }

    // Get merchant info
    const [merchant] = await db
      .select({
        id: merchants.id,
        youcanStoreName: merchants.youcanStoreName,
        youcanStoreId: merchants.youcanStoreId,
        businessName: merchants.businessName,
        contactEmail: merchants.contactEmail,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId));

    // Count orders for this merchant
    const [orderCount] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.merchantId, merchantId));

    // Get latest 3 orders
    const latestOrders = await db
      .select({
        id: orders.id,
        externalRef: orders.externalRef,
        customerName: orders.customerName,
        isTest: orders.isTest,
        pipelineStatus: orders.pipelineStatus,
        decision: orders.decision,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.merchantId, merchantId))
      .orderBy(desc(orders.createdAt))
      .limit(3);

    // Also count by isTest
    const testCounts = await db
      .select({
        isTest: orders.isTest,
        count: count(),
      })
      .from(orders)
      .where(eq(orders.merchantId, merchantId))
      .groupBy(orders.isTest);

    return NextResponse.json({
      sessionMerchantId: merchantId,
      sessionEmail: session?.user?.email,
      legacyCookie,
      merchant,
      totalOrders: orderCount?.count ?? 0,
      testCounts,
      latestOrders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
