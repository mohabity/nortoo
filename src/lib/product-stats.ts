/**
 * Product (SKU) Risk Tracking
 * Tracks per-product delivery statistics for data-driven scoring.
 * Uses UPSERT on (merchantId, productId) to atomically update counters.
 */

import { db } from "@/db/index";
import { productStats, orders } from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Normalize a product name into a stable slug ID.
 * Used when no external productId is available.
 * "T-shirt Nike Dri-FIT" → "t-shirt-nike-dri-fit"
 */
export function normalizeProductId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, "")    // remove special chars
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "");          // trim hyphens
}

// ═══════════════════════════════════════════════════════════
// UPSERT — called after each order insert
// ═══════════════════════════════════════════════════════════

export async function updateProductStats(params: {
  merchantId: number;
  productId: string;
  productName: string;
  productCategory?: string;
  orderTotal: number;
}): Promise<void> {
  const { merchantId, productId, productName, productCategory, orderTotal } = params;

  await db
    .insert(productStats)
    .values({
      merchantId,
      productId,
      productName,
      productCategory: productCategory ?? null,
      totalOrders: 1,
      totalRevenue: orderTotal,
      avgOrderValue: orderTotal,
      lastOrderAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [productStats.merchantId, productStats.productId],
      set: {
        totalOrders: sql`${productStats.totalOrders} + 1`,
        totalRevenue: sql`${productStats.totalRevenue} + ${orderTotal}`,
        avgOrderValue: sql`(${productStats.totalRevenue} + ${orderTotal}) / (${productStats.totalOrders} + 1)`,
        productName, // update name in case it changed
        productCategory: productCategory ?? sql`${productStats.productCategory}`,
        lastOrderAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

// ═══════════════════════════════════════════════════════════
// LOOKUP — called before scoring
// ═══════════════════════════════════════════════════════════

export async function getProductRtoRate(
  merchantId: number,
  productId: string
): Promise<{ rtoRate: number; totalOrders: number } | null> {
  const [row] = await db
    .select({
      rtoRate: productStats.rtoRate,
      totalOrders: productStats.totalOrders,
    })
    .from(productStats)
    .where(
      and(
        eq(productStats.merchantId, merchantId),
        eq(productStats.productId, productId)
      )
    )
    .limit(1);

  return row ?? null;
}

// ═══════════════════════════════════════════════════════════
// FULL RECALCULATION — called by daily cron
// ═══════════════════════════════════════════════════════════

export async function recalculateAllProductStats(merchantId: number): Promise<number> {
  // Get all products for this merchant from orders
  const productAggregates = await db
    .select({
      productId: orders.productId,
      productName: orders.productName,
      productCategory: orders.productCategory,
      totalOrders: sql<number>`count(*)::int`,
      deliveredOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')::int`,
      returnedOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'returned')::int`,
      cancelledOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'cancelled')::int`,
      totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)::real`,
      avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)::real`,
      avgScore: sql<number>`coalesce(avg(${orders.fraudScore}), 0)::real`,
      lastOrderAt: sql<string | null>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        eq(orders.isTest, false),
        sql`${orders.productId} is not null`
      )
    )
    .groupBy(orders.productId, orders.productName, orders.productCategory);

  let updated = 0;

  for (const agg of productAggregates) {
    if (!agg.productId || !agg.productName) continue;

    const terminal = agg.deliveredOrders + agg.returnedOrders;
    const rtoRate = terminal > 0 ? agg.returnedOrders / terminal : 0;

    await db
      .insert(productStats)
      .values({
        merchantId,
        productId: agg.productId,
        productName: agg.productName,
        productCategory: agg.productCategory,
        totalOrders: agg.totalOrders,
        deliveredOrders: agg.deliveredOrders,
        returnedOrders: agg.returnedOrders,
        cancelledOrders: agg.cancelledOrders,
        rtoRate,
        totalRevenue: agg.totalRevenue,
        avgOrderValue: agg.avgOrderValue,
        lastOrderAt: agg.lastOrderAt ? new Date(agg.lastOrderAt) : null,
      })
      .onConflictDoUpdate({
        target: [productStats.merchantId, productStats.productId],
        set: {
          productName: agg.productName,
          productCategory: agg.productCategory,
          totalOrders: agg.totalOrders,
          deliveredOrders: agg.deliveredOrders,
          returnedOrders: agg.returnedOrders,
          cancelledOrders: agg.cancelledOrders,
          rtoRate,
          totalRevenue: agg.totalRevenue,
          avgOrderValue: agg.avgOrderValue,
          lastOrderAt: agg.lastOrderAt ? new Date(agg.lastOrderAt) : null,
          updatedAt: new Date(),
        },
      });

    updated++;
  }

  return updated;
}
