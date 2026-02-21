import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, auditLogs, notifications } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getMerchantContext } from "@/lib/merchant";
import { requireBulkAccess, handleFeatureGateError, BulkLimitError } from "@/lib/require-feature";

const bulkOverrideSchema = z.object({
  orderIds: z.array(z.number().int().positive()).min(1).max(50),
  action: z.enum(["SHIP", "BLOCK"]),
  reason: z.string().optional(),
});

const ACTION_MAP: Record<string, string> = {
  SHIP: "ship",
  BLOCK: "block",
};

const DECISION_LABELS: Record<string, string> = {
  ship: "expédiées",
  block: "bloquées",
};

export async function POST(request: Request) {
  const { merchantId, plan } = await getMerchantContext();

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = bulkOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { orderIds, action, reason } = parsed.data;

  // Plan gate — bulk_actions requires Starter+ with dynamic batch limit
  try {
    requireBulkAccess(plan, orderIds.length);
  } catch (err) {
    if (err instanceof BulkLimitError) {
      return NextResponse.json(
        { error: err.message, code: "BULK_LIMIT" },
        { status: 403 }
      );
    }
    return handleFeatureGateError(err);
  }
  const decision = ACTION_MAP[action];

  // Fetch all orders — verify ownership + get previous decisions
  const existingOrders = await db
    .select({
      id: orders.id,
      decision: orders.decision,
      overrideDecision: orders.overrideDecision,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.id, orderIds),
        eq(orders.merchantId, merchantId),
        eq(orders.isTest, false)
      )
    );

  // Verify all requested IDs were found
  const foundIds = new Set(existingOrders.map((o) => o.id));
  const missingIds = orderIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    return NextResponse.json(
      { error: "Certaines commandes sont invalides" },
      { status: 400 }
    );
  }

  const now = new Date();

  // Batch UPDATE all orders (single atomic SQL)
  await db
    .update(orders)
    .set({
      overrideDecision: decision,
      overrideBy: "merchant",
      overrideReason: reason ?? null,
      overrideAt: now,
      pipelineStatus: "merchant_override",
    })
    .where(
      and(inArray(orders.id, orderIds), eq(orders.merchantId, merchantId))
    );

  // Batch mark related notifications as read
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.merchantId, merchantId),
        inArray(notifications.orderId, orderIds),
        eq(notifications.read, false)
      )
    );

  // Audit log per order (Art. 23 — mandatory)
  const auditValues = existingOrders.map((order) => ({
    merchantId,
    actor: "merchant" as const,
    action: "bulk_override" as const,
    targetType: "order" as const,
    targetId: String(order.id),
    details: JSON.stringify({
      previousDecision: order.overrideDecision ?? order.decision,
      newDecision: decision,
      reason: reason ?? null,
      bulkOperation: true,
      bulkSize: orderIds.length,
      pipelineStatusChange: "merchant_override",
    }),
  }));

  await db.insert(auditLogs).values(auditValues);

  // One summary notification
  const label = DECISION_LABELS[decision] ?? decision;
  await db.insert(notifications).values({
    merchantId,
    type: "bulk_override",
    title: `${orderIds.length} commandes ${label} en masse`,
    message: reason
      ? `Override en masse : ${reason}`
      : `Override en masse de ${orderIds.length} commandes`,
    severity: "info",
    actionUrl: "/dashboard/orders",
  });

  // Build previous decisions for undo support
  const previousDecisions = existingOrders.map((o) => ({
    orderId: o.id,
    previousDecision: o.overrideDecision ?? o.decision,
  }));

  return NextResponse.json({
    data: {
      processed: orderIds.length,
      action,
      orderIds,
      previousDecisions,
    },
  });
}
