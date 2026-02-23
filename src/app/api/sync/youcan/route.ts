import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, orders, auditLogs } from "@/db/schema";
import { and, eq, isNotNull, inArray } from "drizzle-orm";
import { decryptSafe } from "@/lib/encryption";
import { processIncomingOrder } from "@/lib/ingest";
import { QuotaExceededError } from "@/lib/quota";
import { parseYouCanPayload, isCodGateway } from "@/lib/order-pipeline";
import { getMerchantId } from "@/lib/merchant";
import type { YouCanOrderPayload } from "@/types/youcan";

/**
 * POST /api/sync/youcan
 *
 * On-demand sync for the current merchant's YouCan orders.
 * Called automatically when the orders page loads, or manually via the refresh button.
 *
 * Unlike the cron poll (which runs for ALL merchants), this only polls the
 * authenticated merchant's store — fast (~2-3s) and session-scoped.
 *
 * Returns: { synced: number, fetched: number, skipped: number }
 */
export async function POST() {
  try {
    const merchantId = await getMerchantId();

    // Get merchant's YouCan config
    const [merchant] = await db
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
      .where(
        and(eq(merchants.id, merchantId), isNotNull(merchants.youcanStoreId))
      );

    if (!merchant) {
      // No YouCan store connected — not an error, just nothing to sync
      return NextResponse.json({ synced: 0, fetched: 0, message: "No YouCan store connected" });
    }

    const accessToken = decryptSafe(merchant.youcanAccessToken);
    if (!accessToken) {
      return NextResponse.json(
        { error: "YouCan access token missing or invalid" },
        { status: 500 }
      );
    }

    // ── Fetch recent orders from YouCan (up to 2 pages = ~20 orders) ──
    const allOrders: YouCanOrderPayload[] = [];
    let nextPageUrl: string | null = null;
    const maxPages = 2; // Keep it fast — 2 pages max for on-demand sync

    for (let page = 1; page <= maxPages; page++) {
      let apiUrl: URL;
      if (nextPageUrl) {
        apiUrl = new URL(nextPageUrl);
      } else {
        apiUrl = new URL("https://api.youcan.shop/orders");
        apiUrl.searchParams.set("include", "customer,payment,shipping,variants");
      }

      const ordersRes = await fetch(apiUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!ordersRes.ok) {
        const status = ordersRes.status;
        if (status === 401) {
          return NextResponse.json(
            { error: "YouCan token expired — reconnect your store" },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: `YouCan API error: ${status}` },
          { status: 502 }
        );
      }

      const ordersData = await ordersRes.json();
      const pageOrders: YouCanOrderPayload[] = ordersData.data || ordersData || [];
      allOrders.push(...pageOrders);

      // Check for next page
      const paginationLinks = ordersData.meta?.pagination?.links;
      nextPageUrl = paginationLinks?.next || null;
      if (!nextPageUrl) break;
    }

    if (allOrders.length === 0) {
      return NextResponse.json({ synced: 0, fetched: 0 });
    }

    // ── Check which orders already exist in our DB ──
    const externalIds = allOrders.map((o) => String(o.id));
    const existingOrders = await db
      .select({ externalId: orders.externalId })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchant.id),
          inArray(orders.externalId, externalIds)
        )
      );

    const existingSet = new Set(existingOrders.map((o) => o.externalId));

    // ── Process missing orders ──
    let synced = 0;
    let skippedNonCod = 0;
    let skippedNoPhone = 0;
    let skippedQuota = 0;
    const errors: string[] = [];

    for (const order of allOrders) {
      const orderId = String(order.id);

      // Skip if already in DB
      if (existingSet.has(orderId)) continue;

      // Skip non-COD
      const gateway =
        order.payment?.gateway_type ?? order.payment?.payload?.gateway;
      if (!isCodGateway(gateway)) {
        skippedNonCod++;
        continue;
      }

      // Skip if no phone
      const phone =
        order.customer?.phone ||
        order.shipping?.address?.[0]?.phone ||
        order.payment?.address?.[0]?.phone;
      if (!phone) {
        skippedNoPhone++;
        continue;
      }

      try {
        const merchantSettings = {
          id: merchant.id,
          verifyThreshold: merchant.verifyThreshold,
          flagThreshold: merchant.flagThreshold,
          blockThreshold: merchant.blockThreshold,
          autoBlockEnabled: merchant.autoBlockEnabled,
          escalationConfig: merchant.escalationConfig,
          dataRetentionMonths: merchant.dataRetentionMonths,
        };

        const ingestParams = parseYouCanPayload(order, merchantSettings);
        await processIncomingOrder(ingestParams);
        synced++;
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          skippedQuota++;
          break; // No point processing more orders if quota is exceeded
        }
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Order ${orderId}: ${errMsg.substring(0, 100)}`);
      }
    }

    // ── Audit log if orders were recovered ──
    if (synced > 0) {
      await db.insert(auditLogs).values({
        merchantId: merchant.id,
        actor: "system",
        action: "youcan_sync",
        targetType: "merchant",
        targetId: String(merchant.id),
        details: JSON.stringify({
          fetched: allOrders.length,
          synced,
          skippedNonCod,
          skippedNoPhone,
          errors: errors.length,
          trigger: "dashboard",
        }),
      });
    }

    return NextResponse.json({
      synced,
      fetched: allOrders.length,
      skippedNonCod,
      skippedNoPhone,
      skippedQuota,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    // Auth errors (no session)
    if (err instanceof Error && err.message.includes("No authenticated merchant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[sync/youcan] Error:", err);
    return NextResponse.json(
      { error: "Internal sync error" },
      { status: 500 }
    );
  }
}
