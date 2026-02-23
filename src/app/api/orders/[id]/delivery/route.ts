import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, customers, auditLogs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requirePermission, handlePermissionError } from "@/lib/permissions";

const deliverySchema = z.object({
  status: z.enum(["shipped", "delivered", "returned", "cancelled"]),
});

/**
 * PUT /api/orders/[id]/delivery
 * Update delivery status + feed back into customer history.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await requirePermission("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId, userId } = ctx;

  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = deliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  // Verify order exists and belongs to merchant
  const [order] = await db
    .select({
      id: orders.id,
      deliveryStatus: orders.deliveryStatus,
      customerId: orders.customerId,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)));

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const previousStatus = order.deliveryStatus;

  // Skip if same status
  if (previousStatus === status) {
    return NextResponse.json({
      data: { orderId, deliveryStatus: status, changed: false },
    });
  }

  const now = new Date();

  // Update order
  const updateData: Record<string, unknown> = { deliveryStatus: status };
  if (status === "delivered") updateData.deliveredAt = now;

  await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId));

  // ── Feedback into customer history ──
  // Update successfulOrders / failedOrders counters on the linked customer
  if (order.customerId && (status === "delivered" || status === "returned")) {
    try {
      if (status === "delivered") {
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
      }
    } catch (err) {
      console.error("[Delivery] Customer counter update failed:", err);
      // Non-blocking — order status already updated
    }
  }

  // Audit log
  await db.insert(auditLogs).values({
    merchantId,
    userId,
    actor: "merchant",
    action: "delivery_update",
    targetType: "order",
    targetId: String(orderId),
    details: JSON.stringify({
      previous: previousStatus,
      new: status,
    }),
  });

  return NextResponse.json({
    data: { orderId, deliveryStatus: status, changed: true },
  });
}
