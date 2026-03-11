import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, customers, auditLogs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  requireActiveMerchant,
  handlePermissionError,
} from "@/lib/permissions";

const updateDeliverySchema = z.object({
  status: z.enum(["shipped", "delivered", "returned"]),
});

/**
 * PUT /api/crm/orders/[id]/delivery — Update delivery status
 * When delivered → increment customer.successfulOrders
 * When returned → increment customer.failedOrders
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireActiveMerchant("orders:write");
    const { merchantId, userId } = ctx;
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const data = updateDeliverySchema.parse(body);

    // Fetch order with tenant isolation
    const [order] = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        deliveryStatus: orders.deliveryStatus,
      })
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)));

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    // Prevent re-setting to the same status
    if (order.deliveryStatus === data.status) {
      return NextResponse.json(
        { error: "Statut déjà appliqué" },
        { status: 400 }
      );
    }

    // Update order delivery status
    const updates: Record<string, unknown> = {
      deliveryStatus: data.status,
    };
    if (data.status === "delivered") {
      updates.deliveredAt = new Date();
    }

    await db
      .update(orders)
      .set(updates)
      .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)));

    // Update customer stats if customer is linked
    if (order.customerId) {
      // If previous status was already a final state, undo it first
      if (order.deliveryStatus === "delivered") {
        await db
          .update(customers)
          .set({ successfulOrders: sql`${customers.successfulOrders} - 1` })
          .where(
            and(
              eq(customers.id, order.customerId),
              eq(customers.merchantId, merchantId)
            )
          );
      } else if (order.deliveryStatus === "returned") {
        await db
          .update(customers)
          .set({ failedOrders: sql`${customers.failedOrders} - 1` })
          .where(
            and(
              eq(customers.id, order.customerId),
              eq(customers.merchantId, merchantId)
            )
          );
      }

      // Apply new status
      if (data.status === "delivered") {
        await db
          .update(customers)
          .set({ successfulOrders: sql`${customers.successfulOrders} + 1` })
          .where(
            and(
              eq(customers.id, order.customerId),
              eq(customers.merchantId, merchantId)
            )
          );
      } else if (data.status === "returned") {
        await db
          .update(customers)
          .set({ failedOrders: sql`${customers.failedOrders} + 1` })
          .where(
            and(
              eq(customers.id, order.customerId),
              eq(customers.merchantId, merchantId)
            )
          );
      }
    }

    // Audit log
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "crm_delivery_update",
      targetType: "order",
      targetId: String(orderId),
      details: JSON.stringify({
        from: order.deliveryStatus,
        to: data.status,
      }),
    });

    return NextResponse.json({ ok: true, status: data.status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: err.errors },
        { status: 400 }
      );
    }
    return (
      handlePermissionError(err) ??
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}
