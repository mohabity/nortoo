import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, notifications, auditLogs } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";

/**
 * GET /api/cron/escalate
 * Runs every 15 minutes via Vercel cron.
 * Finds orders with needs_review status past their reviewDeadline → escalates.
 */
export async function GET(request: Request) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // Find orders past their review deadline that haven't been escalated
  const overdueOrders = await db
    .select({
      id: orders.id,
      merchantId: orders.merchantId,
      externalRef: orders.externalRef,
      fraudScore: orders.fraudScore,
      reviewDeadline: orders.reviewDeadline,
    })
    .from(orders)
    .where(
      and(
        eq(orders.pipelineStatus, "needs_review"),
        lt(orders.reviewDeadline, now)
      )
    )
    .limit(100);

  let escalatedCount = 0;

  for (const order of overdueOrders) {
    // Update order to escalated (optimistic lock for idempotency)
    const result = await db
      .update(orders)
      .set({
        pipelineStatus: "escalated",
        escalatedAt: now,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.pipelineStatus, "needs_review")
        )
      )
      .returning({ id: orders.id });

    // Skip if another process already escalated this order
    if (result.length === 0) continue;

    const ref = order.externalRef ?? `#${order.id}`;

    // Insert escalation notification
    await db.insert(notifications).values({
      merchantId: order.merchantId,
      orderId: order.id,
      type: "escalation",
      title: `Escalade — Commande ${ref} non traitée`,
      message: `La commande (score ${order.fraudScore}/100) n'a pas été traitée dans le délai imparti. Action immédiate requise.`,
      severity: "critical",
      actionUrl: `/dashboard/orders?selected=${order.id}`,
    });

    // Audit log
    await db.insert(auditLogs).values({
      merchantId: order.merchantId,
      actor: "system",
      action: "escalation",
      targetType: "order",
      targetId: String(order.id),
      details: JSON.stringify({
        previousStatus: "needs_review",
        newStatus: "escalated",
        reviewDeadline: order.reviewDeadline?.toISOString(),
        escalatedAt: now.toISOString(),
      }),
    });

    escalatedCount++;
  }

  return NextResponse.json({
    data: {
      checked: overdueOrders.length,
      escalated: escalatedCount,
      timestamp: now.toISOString(),
    },
  });
}
