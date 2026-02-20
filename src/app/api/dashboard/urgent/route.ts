import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { and, eq, asc, or } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/dashboard/urgent
 * Returns orders needing urgent attention: needs_review + escalated,
 * ordered by escalationPriority (1 = most urgent).
 * Used by the dashboard urgent widget with 60s polling.
 */
export async function GET() {
  const merchantId = await getMerchantId();

  const urgentOrders = await db
    .select({
      id: orders.id,
      externalRef: orders.externalRef,
      customerName: orders.customerName,
      total: orders.total,
      fraudScore: orders.fraudScore,
      decision: orders.decision,
      pipelineStatus: orders.pipelineStatus,
      reviewDeadline: orders.reviewDeadline,
      escalationPriority: orders.escalationPriority,
      escalatedAt: orders.escalatedAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        or(
          eq(orders.pipelineStatus, "needs_review"),
          eq(orders.pipelineStatus, "escalated")
        )
      )
    )
    .orderBy(asc(orders.escalationPriority), asc(orders.reviewDeadline))
    .limit(10);

  return NextResponse.json({ data: urgentOrders });
}
