import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, customers, auditLogs, phoneList } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requirePermission, handlePermissionError } from "@/lib/permissions";

const bulkSchema = z.object({
  updates: z
    .array(
      z.object({
        orderId: z.number().int().min(1).optional(),
        externalRef: z.string().optional(),
        status: z.enum(["shipped", "delivered", "returned", "cancelled"]),
      })
    )
    .min(1)
    .max(500),
});

/**
 * POST /api/orders/bulk-delivery
 * Bulk update delivery statuses (for CSV import or batch operations).
 */
export async function POST(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId, userId } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 400 }
    );
  }

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const u of parsed.data.updates) {
    try {
      // Find order by ID or external ref
      let order;
      if (u.orderId) {
        const [found] = await db
          .select({
            id: orders.id,
            deliveryStatus: orders.deliveryStatus,
            customerId: orders.customerId,
          })
          .from(orders)
          .where(and(eq(orders.id, u.orderId), eq(orders.merchantId, merchantId)))
          .limit(1);
        order = found;
      } else if (u.externalRef) {
        const [found] = await db
          .select({
            id: orders.id,
            deliveryStatus: orders.deliveryStatus,
            customerId: orders.customerId,
          })
          .from(orders)
          .where(
            and(eq(orders.externalRef, u.externalRef), eq(orders.merchantId, merchantId))
          )
          .limit(1);
        order = found;
      }

      if (!order) {
        skipped++;
        continue;
      }

      // Skip if same status
      if (order.deliveryStatus === u.status) {
        skipped++;
        continue;
      }

      const now = new Date();

      // Update order
      const updateData: Record<string, unknown> = { deliveryStatus: u.status };
      if (u.status === "delivered") updateData.deliveredAt = now;

      await db.update(orders).set(updateData).where(eq(orders.id, order.id));

      // Update customer counters
      if (order.customerId && (u.status === "delivered" || u.status === "returned")) {
        if (u.status === "delivered") {
          await db
            .update(customers)
            .set({
              successfulOrders: sql`${customers.successfulOrders} + 1`,
              lastSeen: now,
            })
            .where(eq(customers.id, order.customerId));
        } else {
          await db
            .update(customers)
            .set({
              failedOrders: sql`${customers.failedOrders} + 1`,
              lastSeen: now,
            })
            .where(eq(customers.id, order.customerId));

          // Auto-blacklist: ≥3 failed orders
          try {
            const [cust] = await db
              .select({
                phoneHash: customers.phoneHash,
                phoneLast4: customers.phoneLast4,
                failedOrders: customers.failedOrders,
              })
              .from(customers)
              .where(eq(customers.id, order.customerId))
              .limit(1);

            if (cust && cust.phoneHash && (cust.failedOrders ?? 0) >= 2) {
              const [alreadyListed] = await db
                .select({ id: phoneList.id })
                .from(phoneList)
                .where(
                  and(
                    eq(phoneList.merchantId, merchantId),
                    eq(phoneList.phoneHash, cust.phoneHash)
                  )
                )
                .limit(1);

              if (!alreadyListed) {
                const failCount = (cust.failedOrders ?? 0) + 1;
                await db.insert(phoneList).values({
                  merchantId,
                  phoneHash: cust.phoneHash,
                  phoneMasked: cust.phoneLast4 ? `***${cust.phoneLast4}` : "***",
                  listType: "blacklist",
                  reason: `Auto-blacklist: ${failCount} retours`,
                  addedBy: "auto",
                });
              }
            }
          } catch (autoErr) {
            console.error("[BulkDelivery] Auto-blacklist check failed:", autoErr);
          }
        }
      }

      updated++;
    } catch (err) {
      const ref = u.orderId ?? u.externalRef ?? "?";
      errors.push(`Order ${ref}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  // Audit log (summary)
  await db.insert(auditLogs).values({
    merchantId,
    userId,
    actor: "merchant",
    action: "bulk_delivery_update",
    targetType: "order",
    targetId: "bulk",
    details: JSON.stringify({
      total: parsed.data.updates.length,
      updated,
      skipped,
      errors: errors.length,
    }),
  });

  return NextResponse.json({
    data: {
      total: parsed.data.updates.length,
      updated,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    },
  });
}
