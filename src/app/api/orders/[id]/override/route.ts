import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, auditLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { DEMO_MERCHANT_ID } from "@/lib/merchant";

const overrideSchema = z.object({
  decision: z.enum(["ship", "verify", "flag", "block"]),
  reason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    .where(and(eq(orders.id, orderId), eq(orders.merchantId, DEMO_MERCHANT_ID)));

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const now = new Date();

  // Update order with override
  await db
    .update(orders)
    .set({
      overrideDecision: parsed.data.decision,
      overrideBy: "merchant",
      overrideReason: parsed.data.reason,
      overrideAt: now,
    })
    .where(eq(orders.id, orderId));

  // Art. 23 — Audit log (obligatoire)
  await db.insert(auditLogs).values({
    merchantId: DEMO_MERCHANT_ID,
    actor: "merchant",
    action: "override",
    targetType: "order",
    targetId: String(orderId),
    details: JSON.stringify({
      previousDecision: order.decision,
      newDecision: parsed.data.decision,
      reason: parsed.data.reason,
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
