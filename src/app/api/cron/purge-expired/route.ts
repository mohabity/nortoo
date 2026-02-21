import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { customers, orders, auditLogs, merchants } from "@/db/schema";
import { and, eq, lt, sql, isNotNull } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";

/**
 * GET /api/cron/purge-expired
 * Art. 3e Loi 09-08: Auto-delete data past retention period.
 * Runs daily at 3 AM via Vercel cron.
 *
 * Purges:
 * 1. Customers whose retentionExpiresAt has passed
 * 2. Orders whose retentionExpiresAt has passed
 * 3. Limits to 1000 rows per run to avoid Vercel timeouts
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let purgedCustomers = 0;
  let purgedOrders = 0;

  try {
    // ── 1. Find expired customers (retentionExpiresAt < now) ──
    const expiredCustomers = await db
      .select({ id: customers.id, merchantId: customers.merchantId })
      .from(customers)
      .where(
        and(
          isNotNull(customers.retentionExpiresAt),
          lt(customers.retentionExpiresAt, now)
        )
      )
      .limit(500);

    for (const customer of expiredCustomers) {
      try {
        // Audit log BEFORE deletion (Art. 23)
        await db.insert(auditLogs).values({
          merchantId: customer.merchantId,
          actor: "system",
          action: "data_purge",
          targetType: "customer",
          targetId: String(customer.id),
          details: JSON.stringify({
            reason: "retention_expired",
            purgedAt: now.toISOString(),
          }),
        });

        await db.delete(customers).where(eq(customers.id, customer.id));
        purgedCustomers++;
      } catch (err) {
        console.error(
          `[purge-expired] Failed to purge customer ${customer.id}:`,
          err
        );
      }
    }

    // ── 2. Find expired orders (retentionExpiresAt < now) ──
    const expiredOrders = await db
      .select({ id: orders.id, merchantId: orders.merchantId })
      .from(orders)
      .where(
        and(
          isNotNull(orders.retentionExpiresAt),
          lt(orders.retentionExpiresAt, now)
        )
      )
      .limit(500);

    for (const order of expiredOrders) {
      try {
        // Audit log BEFORE deletion (Art. 23)
        await db.insert(auditLogs).values({
          merchantId: order.merchantId,
          actor: "system",
          action: "data_purge",
          targetType: "order",
          targetId: String(order.id),
          details: JSON.stringify({
            reason: "retention_expired",
            purgedAt: now.toISOString(),
          }),
        });

        await db.delete(orders).where(eq(orders.id, order.id));
        purgedOrders++;
      } catch (err) {
        console.error(
          `[purge-expired] Failed to purge order ${order.id}:`,
          err
        );
      }
    }

    // ── 3. Cleanup old audit logs (> merchant.dataRetentionMonths) ──
    // Audit logs older than 24 months (default) are purged to limit DB growth.
    // We use a global cutoff of 24 months since per-merchant would be expensive.
    const retentionCutoff = new Date(now);
    retentionCutoff.setMonth(retentionCutoff.getMonth() - 24);

    const purgedAuditLogs = await db
      .delete(auditLogs)
      .where(lt(auditLogs.createdAt, retentionCutoff))
      .returning({ id: auditLogs.id });

    console.log(
      `[purge-expired] Purged: ${purgedCustomers} customers, ${purgedOrders} orders, ${purgedAuditLogs.length} audit logs`
    );

    return NextResponse.json({
      data: {
        purgedCustomers,
        purgedOrders,
        purgedAuditLogs: purgedAuditLogs.length,
        timestamp: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("[purge-expired] Critical error:", err);
    return NextResponse.json(
      { error: "Purge failed" },
      { status: 500 }
    );
  }
}
