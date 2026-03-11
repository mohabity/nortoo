import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { customers, orders, auditLogs } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import {
  requirePermission,
  requireActiveMerchant,
  handlePermissionError,
} from "@/lib/permissions";

// ── GET /api/crm/customers/[id] — Customer detail + order history + stats ──

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("orders:read");
    const { merchantId } = ctx;
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Fetch customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.merchantId, merchantId))
      );

    if (!customer) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Fetch recent orders
    const customerOrders = await db
      .select({
        id: orders.id,
        externalRef: orders.externalRef,
        productName: orders.productName,
        total: orders.total,
        fraudScore: orders.fraudScore,
        decision: orders.decision,
        overrideDecision: orders.overrideDecision,
        deliveryStatus: orders.deliveryStatus,
        source: orders.source,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.customerId, customerId),
          eq(orders.merchantId, merchantId)
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(50);

    // Compute avg score
    const [stats] = await db
      .select({
        avgScore: sql<number>`COALESCE(AVG(${orders.fraudScore}), 0)::int`,
        deliveredCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.deliveryStatus} = 'delivered')::int`,
        returnedCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.deliveryStatus} = 'returned')::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.customerId, customerId),
          eq(orders.merchantId, merchantId)
        )
      );

    const deliveryRate =
      customer.totalOrders > 0
        ? Math.round(
            ((customer.successfulOrders) / customer.totalOrders) * 100
          )
        : 0;

    return NextResponse.json({
      customer: {
        ...customer,
        tags: customer.tags ? JSON.parse(customer.tags) : [],
      },
      orders: customerOrders,
      stats: {
        avgScore: stats?.avgScore ?? 0,
        deliveryRate,
        deliveredCount: stats?.deliveredCount ?? 0,
        returnedCount: stats?.returnedCount ?? 0,
      },
    });
  } catch (err) {
    return (
      handlePermissionError(err) ??
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}

// ── PUT /api/crm/customers/[id] — Update customer info ──

const updateCustomerSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive", "blacklisted"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireActiveMerchant("orders:write");
    const { merchantId, userId } = ctx;
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const data = updateCustomerSchema.parse(body);

    // Verify ownership
    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.merchantId, merchantId))
      );

    if (!existing) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.city !== undefined) updates.city = data.city;
    if (data.address !== undefined) updates.address = data.address;
    if (data.tags !== undefined) updates.tags = JSON.stringify(data.tags);
    if (data.status !== undefined) updates.status = data.status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
    }

    await db
      .update(customers)
      .set(updates)
      .where(
        and(eq(customers.id, customerId), eq(customers.merchantId, merchantId))
      );

    // Audit log
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "crm_update_customer",
      targetType: "customer",
      targetId: String(customerId),
      details: JSON.stringify(updates),
    });

    return NextResponse.json({ ok: true });
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

// ── DELETE /api/crm/customers/[id] — Soft delete (mark inactive) ──

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireActiveMerchant("settings:write");
    const { merchantId, userId } = ctx;
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.merchantId, merchantId))
      );

    if (!existing) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Soft delete — mark as inactive
    await db
      .update(customers)
      .set({ status: "inactive" })
      .where(
        and(eq(customers.id, customerId), eq(customers.merchantId, merchantId))
      );

    // Audit log
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "crm_delete_customer",
      targetType: "customer",
      targetId: String(customerId),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return (
      handlePermissionError(err) ??
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}
