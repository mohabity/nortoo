import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { webhookQueue } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/nrt-panel/webhook-queue
 * Admin-only endpoint (merchantId = 1) to monitor the webhook queue.
 * Query: ?status=pending|failed|dead|completed&limit=20
 */
export async function GET(request: NextRequest) {
  // ── Auth: admin only ──
  const token = await getToken({ req: request });
  if (!token || token.merchantId !== 1) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "20", 10),
    100
  );

  // ── Queue items ──
  let query = db
    .select({
      id: webhookQueue.id,
      merchantId: webhookQueue.merchantId,
      source: webhookQueue.source,
      status: webhookQueue.status,
      attempts: webhookQueue.attempts,
      maxAttempts: webhookQueue.maxAttempts,
      nextRetryAt: webhookQueue.nextRetryAt,
      lastAttemptAt: webhookQueue.lastAttemptAt,
      errorMessage: webhookQueue.errorMessage,
      orderId: webhookQueue.orderId,
      createdAt: webhookQueue.createdAt,
      completedAt: webhookQueue.completedAt,
    })
    .from(webhookQueue)
    .orderBy(desc(webhookQueue.createdAt))
    .limit(limit)
    .$dynamic();

  if (statusFilter) {
    query = query.where(eq(webhookQueue.status, statusFilter));
  }

  const items = await query;

  // ── Summary counts ──
  const countRows = await db
    .select({
      status: webhookQueue.status,
      count: sql<number>`count(*)::int`,
    })
    .from(webhookQueue)
    .groupBy(webhookQueue.status);

  const summary: Record<string, number> = {
    pending: 0,
    processing: 0,
    failed: 0,
    dead: 0,
    completed: 0,
  };
  for (const row of countRows) {
    summary[row.status] = row.count;
  }

  return NextResponse.json({ queue: items, summary });
}
