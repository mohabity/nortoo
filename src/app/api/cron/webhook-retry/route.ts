import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { webhookQueue } from "@/db/schema";
import { and, eq, lt, lte, sql } from "drizzle-orm";
import { processWebhook } from "@/lib/webhook-processor";
import { verifyCronSecret } from "@/lib/cron-auth";

/**
 * GET /api/cron/webhook-retry
 * Runs every minute (Vercel cron).
 * Picks up failed webhooks whose nextRetryAt has passed and retries them.
 * Processes max 20 per run to avoid overloading.
 *
 * Also cleans up old completed (>7d) and dead (>30d) entries.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // ── 1. Fetch failed webhooks ready for retry ──
    const pendingRetries = await db
      .select({ id: webhookQueue.id })
      .from(webhookQueue)
      .where(
        and(
          eq(webhookQueue.status, "failed"),
          lte(webhookQueue.nextRetryAt, now),
          lt(webhookQueue.attempts, webhookQueue.maxAttempts)
        )
      )
      .orderBy(webhookQueue.nextRetryAt)
      .limit(20);

    // ── 2. Process each ──
    for (const item of pendingRetries) {
      processed++;
      try {
        await processWebhook(item.id);
        succeeded++;
      } catch {
        failed++;
      }
    }

    // ── 3. Cleanup: completed > 7 days ──
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await db
      .delete(webhookQueue)
      .where(
        and(
          eq(webhookQueue.status, "completed"),
          lt(webhookQueue.createdAt, sevenDaysAgo)
        )
      );

    // ── 4. Cleanup: dead > 30 days ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db
      .delete(webhookQueue)
      .where(
        and(
          eq(webhookQueue.status, "dead"),
          lt(webhookQueue.createdAt, thirtyDaysAgo)
        )
      );
  } catch (error) {
    console.error("[Cron webhook-retry] Error:", error);
    return NextResponse.json(
      { error: "Cron execution error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { processed, succeeded, failed, timestamp: now.toISOString() },
  });
}
