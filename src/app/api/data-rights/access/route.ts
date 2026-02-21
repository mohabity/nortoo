import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { customers, orders, dataRightsRequests, auditLogs } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import {
  requirePermission,
  handlePermissionError,
} from "@/lib/permissions";
import { hashPhone } from "@/lib/hash";

/**
 * POST /api/data-rights/access
 * Art. 7 Loi 09-08 — Droit d'accès.
 * Returns all data held about a consumer identified by phone number.
 * Requires compliance:read permission (admin-only).
 */

const accessSchema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(request: NextRequest) {
  try {
    const { merchantId, userId } = await requirePermission("compliance:read");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = accessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const phoneHash = hashPhone(parsed.data.phone);

    // Find customer by phone hash + merchant
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.merchantId, merchantId),
          eq(customers.phoneHash, phoneHash)
        )
      )
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Aucun client trouvé avec ce numéro de téléphone" },
        { status: 404 }
      );
    }

    // Fetch all orders for this customer (no raw PII returned)
    const customerOrders = await db
      .select({
        id: orders.id,
        externalRef: orders.externalRef,
        total: orders.total,
        currency: orders.currency,
        shippingCity: orders.shippingCity,
        fraudScore: orders.fraudScore,
        decision: orders.decision,
        overrideDecision: orders.overrideDecision,
        deliveryStatus: orders.deliveryStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.customerId, customer.id)
        )
      )
      .orderBy(desc(orders.createdAt));

    // Create audit log + data rights request
    const responseDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [auditEntry] = await db
      .insert(auditLogs)
      .values({
        merchantId,
        userId,
        actor: "merchant",
        action: "data_rights_access",
        targetType: "customer",
        targetId: String(customer.id),
        details: JSON.stringify({
          phoneHashPartial: phoneHash.slice(0, 12) + "...",
          ordersReturned: customerOrders.length,
        }),
      })
      .returning({ id: auditLogs.id });

    await db.insert(dataRightsRequests).values({
      merchantId,
      requesterPhoneHash: phoneHash,
      rightType: "access",
      status: "completed",
      responseDeadline,
      completedAt: new Date(),
      auditLogId: auditEntry?.id ?? null,
    });

    return NextResponse.json({
      data: {
        customer: {
          phoneLast4: customer.phoneLast4,
          name: customer.name,
          city: customer.city,
          totalOrders: customer.totalOrders,
          successfulOrders: customer.successfulOrders,
          failedOrders: customer.failedOrders,
          isOpposed: customer.isOpposed,
          firstSeen: customer.firstSeen.toISOString(),
          lastSeen: customer.lastSeen.toISOString(),
        },
        orders: customerOrders.map((o) => ({
          id: o.id,
          ref: o.externalRef,
          total: o.total,
          currency: o.currency,
          city: o.shippingCity,
          fraudScore: o.fraudScore,
          decision: o.decision,
          overrideDecision: o.overrideDecision,
          deliveryStatus: o.deliveryStatus,
          createdAt: o.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    try {
      return handlePermissionError(err);
    } catch {
      console.error("[data-rights:access]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
