import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import type { VelocityData } from "@/lib/scoring";

/** Compute velocity data for a customer (order frequency, amounts, addresses) */
export async function computeVelocity(
  merchantId: number,
  customerId: number,
): Promise<VelocityData | undefined> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [velocityStats] = await db
      .select({
        ordersLast1h: sql<number>`COUNT(*) FILTER (WHERE ${orders.createdAt} >= ${oneHourAgo})`,
        ordersLast24h: sql<number>`COUNT(*) FILTER (WHERE ${orders.createdAt} >= ${twentyFourHoursAgo})`,
        totalAmountLast24h: sql<number>`COALESCE(SUM(${orders.total}) FILTER (WHERE ${orders.createdAt} >= ${twentyFourHoursAgo}), 0)`,
        ordersLast7d: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.customerId, customerId),
          gt(orders.createdAt, sevenDaysAgo),
          eq(orders.isTest, false)
        )
      );

    const [addrStats] = await db
      .select({
        distinctAddresses: sql<number>`COUNT(DISTINCT ${orders.shippingAddress})`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.customerId, customerId),
          gt(orders.createdAt, twentyFourHoursAgo),
          eq(orders.isTest, false)
        )
      );

    return {
      ordersLast1h: Number(velocityStats?.ordersLast1h ?? 0),
      ordersLast24h: Number(velocityStats?.ordersLast24h ?? 0),
      totalAmountLast24h: Number(velocityStats?.totalAmountLast24h ?? 0),
      ordersLast7d: Number(velocityStats?.ordersLast7d ?? 0),
      distinctAddressesLast24h: Number(addrStats?.distinctAddresses ?? 0),
    };
  } catch (err) {
    console.error("[Ingest] Velocity calculation failed (non-blocking):", err);
    return undefined;
  }
}
