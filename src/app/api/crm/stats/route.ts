import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { customers, orders } from "@/db/schema";
import { and, eq, sql, gte } from "drizzle-orm";
import {
  requirePermission,
  handlePermissionError,
} from "@/lib/permissions";

/**
 * GET /api/crm/stats — CRM KPIs
 */
export async function GET() {
  try {
    const ctx = await requirePermission("orders:read");
    const { merchantId } = ctx;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [customerStats, orderStats, monthlyStats] = await Promise.all([
      // Total customers & by status
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) FILTER (WHERE ${customers.status} = 'active')::int`,
          inactive: sql<number>`count(*) FILTER (WHERE ${customers.status} = 'inactive')::int`,
          blacklisted: sql<number>`count(*) FILTER (WHERE ${customers.status} = 'blacklisted')::int`,
        })
        .from(customers)
        .where(eq(customers.merchantId, merchantId)),

      // All-time order stats for CRM orders
      db
        .select({
          total: sql<number>`count(*)::int`,
          avgScore: sql<number>`COALESCE(AVG(${orders.fraudScore}), 0)::int`,
          delivered: sql<number>`count(*) FILTER (WHERE ${orders.deliveryStatus} = 'delivered')::int`,
          returned: sql<number>`count(*) FILTER (WHERE ${orders.deliveryStatus} = 'returned')::int`,
          shipped: sql<number>`count(*) FILTER (WHERE ${orders.deliveryStatus} = 'shipped')::int`,
          pending: sql<number>`count(*) FILTER (WHERE ${orders.deliveryStatus} = 'pending')::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false)
          )
        ),

      // This month's orders
      db
        .select({
          count: sql<number>`count(*)::int`,
          totalValue: sql<number>`COALESCE(SUM(${orders.total}), 0)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false),
            gte(orders.createdAt, startOfMonth)
          )
        ),
    ]);

    const cs = customerStats[0];
    const os = orderStats[0];
    const ms = monthlyStats[0];

    const deliveryRate =
      os && os.total > 0
        ? Math.round(((os.delivered ?? 0) / os.total) * 100)
        : 0;

    return NextResponse.json({
      customers: {
        total: cs?.total ?? 0,
        active: cs?.active ?? 0,
        inactive: cs?.inactive ?? 0,
        blacklisted: cs?.blacklisted ?? 0,
      },
      orders: {
        total: os?.total ?? 0,
        avgScore: os?.avgScore ?? 0,
        delivered: os?.delivered ?? 0,
        returned: os?.returned ?? 0,
        shipped: os?.shipped ?? 0,
        pending: os?.pending ?? 0,
        deliveryRate,
      },
      thisMonth: {
        count: ms?.count ?? 0,
        totalValue: ms?.totalValue ?? 0,
      },
    });
  } catch (err) {
    return (
      handlePermissionError(err) ??
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}
