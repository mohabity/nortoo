import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, auditLogs, notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireActiveMerchant, handlePermissionError } from "@/lib/permissions";

const overrideSchema = z.object({
  decision: z.enum(["ship", "verify", "flag", "block"]),
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await requireActiveMerchant("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId, userId } = ctx;
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  // Parse & validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = overrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  // Verify order exists and belongs to merchant
  const [order] = await db
    .select({ id: orders.id, decision: orders.decision })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)));

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const now = new Date();

  // Update order with override + pipeline status
  await db
    .update(orders)
    .set({
      overrideDecision: parsed.data.decision,
      overrideBy: "merchant",
      overrideReason: parsed.data.reason,
      overrideAt: now,
      pipelineStatus: "merchant_override",
    })
    .where(eq(orders.id, orderId));

  // Auto-mark related notifications as read
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.merchantId, merchantId),
        eq(notifications.orderId, orderId),
        eq(notifications.read, false)
      )
    );

  // Art. 23 — Audit log (obligatoire)
  await db.insert(auditLogs).values({
    merchantId,
    userId,
    actor: "merchant",
    action: "override",
    targetType: "order",
    targetId: String(orderId),
    details: JSON.stringify({
      previousDecision: order.decision,
      newDecision: parsed.data.decision,
      reason: parsed.data.reason,
      pipelineStatusChange: "merchant_override",
    }),
  });

  return NextResponse.json({
    data: {
      orderId,
      overrideDecision: parsed.data.decision,
      overrideBy: "merchant",
      overrideReason: parsed.data.reason,
      overrideAt: now.toISOString(),
    },
  });
}
