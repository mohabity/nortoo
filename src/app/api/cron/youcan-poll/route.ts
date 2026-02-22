import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, orders, auditLogs } from "@/db/schema";
import { and, eq, isNotNull, desc, sql } from "drizzle-orm";
import { decryptSafe } from "@/lib/encryption";
import { processIncomingOrder, type IngestParams } from "@/lib/ingest";
import { parseYouCanPayload } from "@/lib/order-pipeline";
import type { YouCanOrderPayload } from "@/types/youcan";

/**
 * GET /api/cron/youcan-poll
 *
 * Polling fallback for YouCan webhooks.
 * Runs every 5 minutes via Vercel Cron.
 *
 * For each merchant with a YouCan store:
 * 1. Fetch recent orders from YouCan API (last 30 minutes)
 * 2. Check which ones are already in our DB (by externalId)
 * 3. Ingest any missing orders through the normal pipeline
 *
 * This is a safety net — if a webhook fails or YouCan stops sending them,
 * orders are still captured within ~5 minutes.
 */
export async function GET(request: Request) {
  // Vercel Cron auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{
    merchantId: number;
    storeName: string | null;
    fetched: number;
    newOrders: number;
    errors: string[];
  }> = [];

  // Find all merchants with YouCan connected
  const youcanMerchants = await db
    .select({
      id: merchants.id,
      youcanStoreId: merchants.youcanStoreId,
      youcanStoreName: merchants.youcanStoreName,
      youcanAccessToken: merchants.youcanAccessToken,
      apiKey: merchants.apiKey,
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
      autoBlockEnabled: merchants.autoBlockEnabled,
      escalationConfig: merchants.escalationConfig,
      dataRetentionMonths: merchants.dataRetentionMonths,
    })
    .from(merchants)
    .where(isNotNull(merchants.youcanStoreId));

  for (const m of youcanMerchants) {
    const result: (typeof results)[0] = {
      merchantId: m.id,
      storeName: m.youcanStoreName,
      fetched: 0,
      newOrders: 0,
      errors: [],
    };

    try {
      const accessToken = decryptSafe(m.youcanAccessToken);
      if (!accessToken) {
        result.errors.push("No access token");
        results.push(result);
        continue;
      }

      // ── Fetch recent orders from YouCan ──
      // Include customer, payment, shipping, variants for full data
      const apiUrl = new URL("https://api.youcan.shop/orders");
      apiUrl.searchParams.set("include", "customer,payment,shipping,variants");
      // YouCan API returns newest first by default

      const ordersRes = await fetch(apiUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!ordersRes.ok) {
        const errText = await ordersRes.text();
        if (ordersRes.status === 401) {
          result.errors.push("Token expired or invalid");
        } else {
          result.errors.push(`API error: ${ordersRes.status} ${errText.substring(0, 200)}`);
        }
        results.push(result);
        continue;
      }

      const ordersData = await ordersRes.json();
      const youcanOrders: YouCanOrderPayload[] = ordersData.data || ordersData || [];
      result.fetched = youcanOrders.length;

      if (youcanOrders.length === 0) {
        results.push(result);
        continue;
      }

      // ── Check which orders already exist in our DB ──
      const externalIds = youcanOrders.map((o) => String(o.id));
      const existingOrders = await db
        .select({ externalId: orders.externalId })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, m.id),
            sql`${orders.externalId} = ANY(${externalIds})`
          )
        );

      const existingSet = new Set(existingOrders.map((o) => o.externalId));

      // ── Process missing orders ──
      for (const order of youcanOrders) {
        const orderId = String(order.id);

        // Skip if already processed
        if (existingSet.has(orderId)) continue;

        // Skip non-COD orders
        const gateway = order.payment?.payload?.gateway;
        if (gateway && gateway !== "cod") continue;

        // Skip orders without phone
        const phone =
          order.customer?.phone ||
          order.shipping?.address?.[0]?.phone ||
          order.payment?.address?.[0]?.phone;
        if (!phone) continue;

        try {
          // Parse via existing pipeline
          const merchantSettings = {
            id: m.id,
            verifyThreshold: m.verifyThreshold,
            flagThreshold: m.flagThreshold,
            blockThreshold: m.blockThreshold,
            autoBlockEnabled: m.autoBlockEnabled,
            escalationConfig: m.escalationConfig,
            dataRetentionMonths: m.dataRetentionMonths,
          };

          const ingestParams = parseYouCanPayload(order, merchantSettings);
          await processIncomingOrder(ingestParams);
          result.newOrders++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Order ${orderId}: ${errMsg.substring(0, 100)}`);
        }
      }

      // ── Audit log if new orders were found ──
      if (result.newOrders > 0) {
        await db.insert(auditLogs).values({
          merchantId: m.id,
          actor: "system",
          action: "youcan_poll_recovery",
          targetType: "merchant",
          targetId: String(m.id),
          details: JSON.stringify({
            fetched: result.fetched,
            newOrders: result.newOrders,
            errors: result.errors.length,
          }),
        });
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }

    results.push(result);
  }

  const totalNew = results.reduce((sum, r) => sum + r.newOrders, 0);

  return NextResponse.json({
    message: `Polled ${results.length} store(s), recovered ${totalNew} order(s)`,
    results,
  });
}
