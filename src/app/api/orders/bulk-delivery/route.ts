import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, customers, auditLogs, phoneList } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { requireActiveMerchant, handlePermissionError } from "@/lib/permissions";

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
    ctx = await requireActiveMerchant("orders:write");
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
      { error: "Données invalides" },
      { status: 400 }
    );
  }

  // ── Phase 1: Batch-fetch all referenced orders ──
  const byId = parsed.data.updates.filter((u) => u.orderId);
  const byRef = parsed.data.updates.filter((u) => !u.orderId && u.externalRef);

  const orderIds = byId.map((u) => u.orderId!);
  const externalRefs = byRef.map((u) => u.externalRef!);

  const allOrders = [
    ...(orderIds.length > 0
      ? await db
          .select({
            id: orders.id,
            externalRef: orders.externalRef,
            deliveryStatus: orders.deliveryStatus,
            customerId: orders.customerId,
          })
          .from(orders)
          .where(and(inArray(orders.id, orderIds), eq(orders.merchantId, merchantId)))
      : []),
    ...(externalRefs.length > 0
      ? await db
          .select({
            id: orders.id,
            externalRef: orders.externalRef,
            deliveryStatus: orders.deliveryStatus,
            customerId: orders.customerId,
          })
          .from(orders)
          .where(and(inArray(orders.externalRef, externalRefs), eq(orders.merchantId, merchantId)))
      : []),
  ];

  const orderById = new Map(allOrders.map((o) => [o.id, o]));
  const orderByRef = new Map(allOrders.filter((o) => o.externalRef).map((o) => [o.externalRef!, o]));

  // ── Phase 2: Classify updates by target status ──
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];
  const now = new Date();

  const deliveredOrderIds: number[] = [];
  const returnedOrderIds: number[] = [];
  const shippedOrderIds: number[] = [];
  const cancelledOrderIds: number[] = [];
  const deliveredCustomerIds: number[] = [];
  const returnedCustomerIds: number[] = [];

  for (const u of parsed.data.updates) {
    const order = u.orderId ? orderById.get(u.orderId) : u.externalRef ? orderByRef.get(u.externalRef) : undefined;

    if (!order || order.deliveryStatus === u.status) {
      skipped++;
      continue;
    }

    if (u.status === "delivered") {
      deliveredOrderIds.push(order.id);
      if (order.customerId) deliveredCustomerIds.push(order.customerId);
    } else if (u.status === "returned") {
      returnedOrderIds.push(order.id);
      if (order.customerId) returnedCustomerIds.push(order.customerId);
    } else if (u.status === "shipped") {
      shippedOrderIds.push(order.id);
    } else {
      cancelledOrderIds.push(order.id);
    }
    updated++;
  }

  // ── Phase 3: Batch updates by status ──
  try {
    const batchOps: Promise<unknown>[] = [];

    if (deliveredOrderIds.length > 0) {
      batchOps.push(
        db.update(orders).set({ deliveryStatus: "delivered", deliveredAt: now }).where(inArray(orders.id, deliveredOrderIds))
      );
    }
    if (returnedOrderIds.length > 0) {
      batchOps.push(
        db.update(orders).set({ deliveryStatus: "returned" }).where(inArray(orders.id, returnedOrderIds))
      );
    }
    if (shippedOrderIds.length > 0) {
      batchOps.push(
        db.update(orders).set({ deliveryStatus: "shipped" }).where(inArray(orders.id, shippedOrderIds))
      );
    }
    if (cancelledOrderIds.length > 0) {
      batchOps.push(
        db.update(orders).set({ deliveryStatus: "cancelled" }).where(inArray(orders.id, cancelledOrderIds))
      );
    }

    await Promise.all(batchOps);

    // ── Phase 4: Batch customer counter updates ──
    const counterOps: Promise<unknown>[] = [];

    if (deliveredCustomerIds.length > 0) {
      counterOps.push(
        db.update(customers).set({ successfulOrders: sql`${customers.successfulOrders} + 1`, lastSeen: now })
          .where(inArray(customers.id, [...new Set(deliveredCustomerIds)]))
      );
    }
    if (returnedCustomerIds.length > 0) {
      const uniqueReturned = [...new Set(returnedCustomerIds)];
      counterOps.push(
        db.update(customers).set({ failedOrders: sql`${customers.failedOrders} + 1`, lastSeen: now })
          .where(inArray(customers.id, uniqueReturned))
      );
    }

    await Promise.all(counterOps);

    // ── Phase 5: Auto-blacklist (batch) ──
    if (returnedCustomerIds.length > 0) {
      try {
        const uniqueReturned = [...new Set(returnedCustomerIds)];
        const custsToCheck = await db
          .select({ id: customers.id, phoneHash: customers.phoneHash, phoneLast4: customers.phoneLast4, failedOrders: customers.failedOrders })
          .from(customers)
          .where(inArray(customers.id, uniqueReturned));

        const toBlacklist = custsToCheck.filter((c) => c.phoneHash && (c.failedOrders ?? 0) >= 3);

        if (toBlacklist.length > 0) {
          const phoneHashes = toBlacklist.map((c) => c.phoneHash!);
          const existing = await db
            .select({ phoneHash: phoneList.phoneHash })
            .from(phoneList)
            .where(and(eq(phoneList.merchantId, merchantId), inArray(phoneList.phoneHash, phoneHashes)));
          const existingSet = new Set(existing.map((e) => e.phoneHash));

          const newEntries = toBlacklist
            .filter((c) => !existingSet.has(c.phoneHash!))
            .map((c) => ({
              merchantId,
              phoneHash: c.phoneHash!,
              phoneMasked: c.phoneLast4 ? `***${c.phoneLast4}` : "***",
              listType: "blacklist" as const,
              reason: `Auto-blacklist: ${c.failedOrders ?? 0} retours`,
              addedBy: "auto",
            }));

          if (newEntries.length > 0) {
            await db.insert(phoneList).values(newEntries);
          }
        }
      } catch (autoErr) {
        console.error("[BulkDelivery] Auto-blacklist batch failed:", autoErr);
      }
    }
  } catch (batchErr) {
    console.error("[BulkDelivery] Batch update failed:", batchErr);
    errors.push(`Erreur batch: ${batchErr instanceof Error ? batchErr.message : "inconnu"}`);
  }

  // Audit log (summary)
  await db.insert(auditLogs).values({
    merchantId,
    userId,
    actor: "merchant",
    action: "bulk_delivery_update",
    targetType: "order",
    targetId: "bulk",
    details: JSON.stringify({ total: parsed.data.updates.length, updated, skipped, errors: errors.length }),
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
