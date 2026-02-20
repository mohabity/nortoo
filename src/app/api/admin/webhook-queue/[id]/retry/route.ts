import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { webhookQueue } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getToken } from "next-auth/jwt";
import { processWebhook } from "@/lib/webhook-processor";

/**
 * POST /api/admin/webhook-queue/[id]/retry
 * Admin-only. Force-retry a webhook (even if "dead").
 * Extends maxAttempts by 3 to allow more retries after a fix.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth: admin only ──
  const token = await getToken({ req: request });
  if (!token || token.merchantId !== 1) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // ── Find the webhook ──
  const [webhook] = await db
    .select({ id: webhookQueue.id, status: webhookQueue.status, maxAttempts: webhookQueue.maxAttempts })
    .from(webhookQueue)
    .where(eq(webhookQueue.id, id))
    .limit(1);

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  // ── Reset to pending + extend max attempts ──
  await db
    .update(webhookQueue)
    .set({
      status: "pending",
      maxAttempts: (webhook.maxAttempts || 5) + 3,
      nextRetryAt: null,
      errorMessage: null,
      errorStack: null,
    })
    .where(eq(webhookQueue.id, id));

  // ── Attempt immediate processing ──
  let processError: string | null = null;
  try {
    await processWebhook(id);
  } catch (error) {
    processError =
      error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json({
    success: true,
    id,
    previousStatus: webhook.status,
    processError,
  });
}
