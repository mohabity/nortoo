import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { customers, orders, auditLogs, merchants } from "@/db/schema";
import { and, eq, lt, sql, isNotNull, inArray } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";

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

  try {
    const result = await withCronMonitoring("purge-expired", async () => {
      const now = new Date();
      let purgedCustomers = 0;
      let purgedOrders = 0;

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

      if (expiredCustomers.length > 0) {
        const customerIds = expiredCustomers.map((c) => c.id);
        // Audit log BEFORE deletion (Art. 23)
        await db.insert(auditLogs).values(
          expiredCustomers.map((c) => ({
            merchantId: c.merchantId,
            actor: "system" as const,
            action: "data_purge",
            targetType: "customer",
            targetId: String(c.id),
            details: JSON.stringify({
              reason: "retention_expired",
              purgedAt: now.toISOString(),
            }),
          }))
        );
        // Batch delete
        await db.delete(customers).where(inArray(customers.id, customerIds));
        purgedCustomers = customerIds.length;
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

      if (expiredOrders.length > 0) {
        const orderIds = expiredOrders.map((o) => o.id);
        // Audit log BEFORE deletion (Art. 23)
        await db.insert(auditLogs).values(
          expiredOrders.map((o) => ({
            merchantId: o.merchantId,
            actor: "system" as const,
            action: "data_purge",
            targetType: "order",
            targetId: String(o.id),
            details: JSON.stringify({
              reason: "retention_expired",
              purgedAt: now.toISOString(),
            }),
          }))
        );
        // Batch delete
        await db.delete(orders).where(inArray(orders.id, orderIds));
        purgedOrders = orderIds.length;
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

      return {
        purgedCustomers,
        purgedOrders,
        purgedAuditLogs: purgedAuditLogs.length,
        timestamp: now.toISOString(),
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[purge-expired] Critical error:", err);
    return NextResponse.json(
      { error: "Purge failed" },
      { status: 500 }
    );
  }
}
