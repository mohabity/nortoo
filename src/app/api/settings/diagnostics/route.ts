import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, merchants, webhookQueue } from "@/db/schema";
import { eq, and, desc, count, gte } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { getAppUrl } from "@/lib/env";

/**
 * GET /api/settings/diagnostics
 * Returns webhook connection health diagnostics for the current merchant.
 */
export async function GET() {
  const merchantId = await getMerchantId();

  const [merchantData, lastRealWebhook, lastTestWebhook, totalCounts, last24hCounts, queueRows] =
    await Promise.all([
      // Merchant info
      db
        .select({
          youcanStoreId: merchants.youcanStoreId,
          youcanStoreName: merchants.youcanStoreName,
          youcanAccessToken: merchants.youcanAccessToken,
          apiKey: merchants.apiKey,
        })
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .limit(1),

      // Last real webhook (isTest = false)
      db
        .select({ createdAt: orders.createdAt })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false)
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(1),

      // Last test webhook (isTest = true)
      db
        .select({ createdAt: orders.createdAt })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, true)
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(1),

      // Total webhooks received (real only)
      db
        .select({ count: count() })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false)
          )
        ),

      // Webhooks in last 24h (real only)
      db
        .select({ count: count() })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false),
            gte(orders.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
          )
        ),

      // Queue status counts
      db
        .select({
          status: webhookQueue.status,
          count: count(),
        })
        .from(webhookQueue)
        .where(eq(webhookQueue.merchantId, merchantId))
        .groupBy(webhookQueue.status),
    ]);

  const m = merchantData[0];

  // Build queue status object
  const queueStatus: Record<string, number> = {};
  for (const row of queueRows) {
    queueStatus[row.status] = row.count;
  }

  // Determine token status
  let tokenStatus: "present" | "absent" | "unknown" = "unknown";
  if (m?.youcanAccessToken) tokenStatus = "present";
  else if (m?.youcanStoreId && !m?.youcanAccessToken) tokenStatus = "absent";

  const webhookUrl = `${getAppUrl()}/api/webhook/ingest`;

  return NextResponse.json({
    data: {
      storeConnected: !!m?.youcanStoreId,
      storeName: m?.youcanStoreName ?? null,
      storeId: m?.youcanStoreId ?? null,
      hasApiKey: !!m?.apiKey,
      webhookUrl,
      lastRealWebhookAt: lastRealWebhook[0]?.createdAt?.toISOString() ?? null,
      lastTestWebhookAt: lastTestWebhook[0]?.createdAt?.toISOString() ?? null,
      totalWebhooksReceived: totalCounts[0]?.count ?? 0,
      totalWebhooksLast24h: last24hCounts[0]?.count ?? 0,
      tokenStatus,
      queueStatus,
    },
  });
}
