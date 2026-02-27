import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { orders, merchants, webhookQueue } from "@/db/schema";
import { eq, count, desc, and, or } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * GET /api/nrt-panel/debug-session
 * Diagnostic: shows which merchant the current session resolves to,
 * and how many orders exist for that merchant.
 */
export async function GET(request: Request) {
  try {
    // Session info
    const session = await auth();
    const cookieStore = await cookies();
    const legacyCookie = cookieStore.get("nortoo_merchant")?.value;

    // Allow ?merchant=3 for direct DB check (no session needed)
    const url = new URL(request.url);
    const queryMerchant = url.searchParams.get("merchant");

    const merchantId = queryMerchant
      ? parseInt(queryMerchant, 10)
      : session?.user?.merchantId;

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
      .limit(20);

    // Also count by isTest
    const testCounts = await db
      .select({
        isTest: orders.isTest,
        count: count(),
      })
      .from(orders)
      .where(eq(orders.merchantId, merchantId))
      .groupBy(orders.isTest);

    // Check webhook_queue for failed/dead entries
    const failedWebhooks = await db
      .select({
        id: webhookQueue.id,
        status: webhookQueue.status,
        attempts: webhookQueue.attempts,
        errorMessage: webhookQueue.errorMessage,
        source: webhookQueue.source,
        createdAt: webhookQueue.createdAt,
      })
      .from(webhookQueue)
      .where(
        and(
          eq(webhookQueue.merchantId, merchantId),
          or(
            eq(webhookQueue.status, "failed"),
            eq(webhookQueue.status, "dead")
          )
        )
      )
      .orderBy(desc(webhookQueue.createdAt))
      .limit(10);

    // Count webhook_queue by status
    const queueCounts = await db
      .select({
        status: webhookQueue.status,
        count: count(),
      })
      .from(webhookQueue)
      .where(eq(webhookQueue.merchantId, merchantId))
      .groupBy(webhookQueue.status);

    return NextResponse.json({
      sessionMerchantId: merchantId,
      sessionEmail: session?.user?.email,
      legacyCookie,
      merchant,
      totalOrders: orderCount?.count ?? 0,
      testCounts,
      latestOrders,
      webhookQueue: {
        counts: queueCounts,
        failedOrDead: failedWebhooks,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
