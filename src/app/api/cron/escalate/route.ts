import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, notifications, auditLogs, merchants } from "@/db/schema";
import { and, eq, lt, asc, isNotNull } from "drizzle-orm";
import { recalculateAllProductStats } from "@/lib/product-stats";
import { recalculateAllCityStats } from "@/lib/city-stats";
import { recalculateAllZoneStats } from "@/lib/zone-stats";
import { getEscalationContext } from "@/lib/escalation";

/**
 * GET /api/cron/escalate
 * Runs every 15 minutes via Vercel cron.
 * Finds needs_review orders past their reviewDeadline → escalates.
 * Orders are processed by escalationPriority (highest priority first).
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

  // Find orders past their review deadline, ordered by priority (1=highest)
  const overdueOrders = await db
    .select({
      id: orders.id,
      merchantId: orders.merchantId,
      externalRef: orders.externalRef,
      fraudScore: orders.fraudScore,
      decision: orders.decision,
      total: orders.total,
      escalationPriority: orders.escalationPriority,
      reviewDeadline: orders.reviewDeadline,
    })
    .from(orders)
    .where(
      and(
        eq(orders.pipelineStatus, "needs_review"),
        isNotNull(orders.reviewDeadline),
        lt(orders.reviewDeadline, now)
      )
    )
    .orderBy(asc(orders.escalationPriority))
    .limit(50);

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

    // Dynamic severity from escalation context
    const escalationCtx = getEscalationContext(order.decision, order.total);

    // Insert escalation notification with dynamic severity
    await db.insert(notifications).values({
      merchantId: order.merchantId,
      orderId: order.id,
      type: "escalation",
      title: `Escalade — Commande ${ref} non traitée`,
      message: `La commande (score ${order.fraudScore}/100) n'a pas été traitée dans le délai imparti. Action immédiate requise.`,
      severity: escalationCtx.severity,
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
        priority: order.escalationPriority,
        severity: escalationCtx.severity,
        reviewDeadline: order.reviewDeadline?.toISOString(),
        escalatedAt: now.toISOString(),
      }),
    });

    escalatedCount++;
  }

  // ── Stats recalculation (daily consistency check) ──
  let productsUpdated = 0;
  let citiesUpdated = 0;
  let zonesUpdated = 0;

  try {
    // Get all active merchants
    const allMerchants = await db
      .select({ id: merchants.id })
      .from(merchants);

    for (const m of allMerchants) {
      try {
        productsUpdated += await recalculateAllProductStats(m.id);
        citiesUpdated += await recalculateAllCityStats(m.id);
        zonesUpdated += await recalculateAllZoneStats(m.id);
      } catch (err) {
        console.error(`[Cron Escalate] Stats recalc failed for merchant ${m.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[Cron Escalate] Stats recalculation error:", err);
  }

  return NextResponse.json({
    data: {
      checked: overdueOrders.length,
      escalated: escalatedCount,
      productsUpdated,
      citiesUpdated,
      zonesUpdated,
      timestamp: now.toISOString(),
    },
  });
}
