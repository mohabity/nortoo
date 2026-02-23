/**
 * Webhook Queue — Enqueue, process, retry logic.
 *
 * Flow:
 * 1. enqueueWebhook() — stores raw payload + SHA-256 hash for dedup
 * 2. processWebhook() — parses, runs full pipeline, updates status
 * 3. calculateNextRetry() — exponential backoff with jitter
 */

import { createHash } from "crypto";
import { db } from "@/db/index";
import {
  webhookQueue,
  notifications,
  auditLogs,
} from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { processIncomingOrder, type IngestParams } from "@/lib/ingest";
import { QuotaExceededError } from "@/lib/quota";
import { parseYouCanPayload, parseIngestPayload } from "@/lib/order-pipeline";
import { validateApiKey } from "@/lib/api-key";

// ── Enqueue ──────────────────────────────────────────────

interface EnqueueParams {
  merchantId: number;
  source: "youcan" | "ingest";
  payload: string; // raw JSON body
  headers?: string; // JSON of relevant headers
}

/**
 * Enqueue a webhook for processing.
 * Returns the queue ID, or null if it's a duplicate.
 */
export async function enqueueWebhook(
  params: EnqueueParams
): Promise<number | null> {
  const payloadHash = createHash("sha256")
    .update(params.payload)
    .digest("hex");

  // Deduplication: same merchant + same payload hash within 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const [existing] = await db
    .select({ id: webhookQueue.id })
    .from(webhookQueue)
    .where(
      and(
        eq(webhookQueue.merchantId, params.merchantId),
        eq(webhookQueue.payloadHash, payloadHash),
        gt(webhookQueue.createdAt, fiveMinAgo)
      )
    )
    .limit(1);

  if (existing) {
    return null; // duplicate
  }

  const [inserted] = await db
    .insert(webhookQueue)
    .values({
      merchantId: params.merchantId,
      source: params.source,
      payload: params.payload,
      headers: params.headers,
      status: "pending",
      payloadHash,
    })
    .returning({ id: webhookQueue.id });

  return inserted.id;
}

// ── Process ──────────────────────────────────────────────

/**
 * Process a single webhook from the queue.
 * Runs the full pipeline (parse → hash → score → save).
 * On failure, increments attempts and schedules retry.
 * On exhaustion (5 attempts), marks as "dead" + creates critical notification.
 */
export async function processWebhook(queueId: number): Promise<void> {
  // 1. Load webhook
  const [webhook] = await db
    .select()
    .from(webhookQueue)
    .where(eq(webhookQueue.id, queueId))
    .limit(1);

  if (!webhook || webhook.status === "completed" || webhook.status === "dead") {
    return;
  }

  // 2. Mark as processing
  await db
    .update(webhookQueue)
    .set({ status: "processing", lastAttemptAt: new Date() })
    .where(eq(webhookQueue.id, queueId));

  try {
    // 3. Load merchant settings for pipeline
    const merchant = await getMerchantForPipeline(webhook.merchantId);
    if (!merchant) {
      throw new Error(`Merchant ${webhook.merchantId} not found`);
    }

    // 4. Parse payload based on source
    const payload = JSON.parse(webhook.payload);
    let ingestParams: IngestParams;

    if (webhook.source === "youcan") {
      ingestParams = parseYouCanPayload(payload, merchant);
    } else {
      ingestParams = parseIngestPayload(payload, merchant);
    }

    // 5. Run the full pipeline
    const result = await processIncomingOrder(ingestParams);

    // 6. Mark as completed
    await db
      .update(webhookQueue)
      .set({
        status: "completed",
        orderId: result.orderId,
        completedAt: new Date(),
        attempts: (webhook.attempts || 0) + 1,
      })
      .where(eq(webhookQueue.id, queueId));
  } catch (error) {
    // 7a. Quota exceeded — don't retry (quota won't change), mark as failed immediately
    if (error instanceof QuotaExceededError) {
      await db
        .update(webhookQueue)
        .set({
          status: "failed",
          attempts: (webhook.attempts || 0) + 1,
          lastAttemptAt: new Date(),
          nextRetryAt: null,
          errorMessage: error.message,
        })
        .where(eq(webhookQueue.id, queueId));

      throw error; // Re-throw so webhook route can return 429
    }

    // 7b. Handle other failures (with retry)
    const attempts = (webhook.attempts || 0) + 1;
    const isExhausted = attempts >= (webhook.maxAttempts || 5);
    const errMsg =
      error instanceof Error ? error.message : String(error);
    const errStack =
      error instanceof Error
        ? error.stack?.substring(0, 1000) ?? null
        : null;

    await db
      .update(webhookQueue)
      .set({
        status: isExhausted ? "dead" : "failed",
        attempts,
        lastAttemptAt: new Date(),
        nextRetryAt: isExhausted ? null : calculateNextRetry(attempts),
        errorMessage: errMsg,
        errorStack: errStack,
      })
      .where(eq(webhookQueue.id, queueId));

    if (isExhausted) {
      // Critical notification for merchant
      await db.insert(notifications).values({
        merchantId: webhook.merchantId,
        type: "webhook_failed",
        title: "Commande non traitée",
        message: `Un webhook ${webhook.source} n'a pas pu être traité après ${webhook.maxAttempts} tentatives. ID: ${queueId}. Erreur: ${errMsg.substring(0, 200)}`,
        severity: "critical",
        actionUrl: "/dashboard/settings",
      });

      // Audit log
      await db.insert(auditLogs).values({
        merchantId: webhook.merchantId,
        actor: "system",
        action: "webhook_dead_letter",
        targetType: "webhook_queue",
        targetId: String(queueId),
        details: JSON.stringify({
          queueId,
          source: webhook.source,
          attempts,
          error: errMsg.substring(0, 500),
        }),
      });
    }

    throw error; // Re-throw so caller knows it failed
  }
}

// ── Backoff ──────────────────────────────────────────────

/**
 * Exponential backoff with ±20% jitter.
 * Attempt 1 → 30s, 2 → 2min, 3 → 8min, 4 → 30min, 5 → dead
 */
function calculateNextRetry(attempt: number): Date {
  const baseDelaySeconds = [30, 120, 480, 1800, 0];
  const delay = baseDelaySeconds[Math.min(attempt - 1, 4)] || 1800;
  const jitter = Math.floor(Math.random() * delay * 0.2); // ±20%
  return new Date(Date.now() + (delay + jitter) * 1000);
}

// ── Helpers ──────────────────────────────────────────────

import { merchants } from "@/db/schema";

async function getMerchantForPipeline(merchantId: number) {
  const [m] = await db
    .select({
      id: merchants.id,
      verifyThreshold: merchants.verifyThreshold,
      flagThreshold: merchants.flagThreshold,
      blockThreshold: merchants.blockThreshold,
      autoBlockEnabled: merchants.autoBlockEnabled,
      escalationConfig: merchants.escalationConfig,
      dataRetentionMonths: merchants.dataRetentionMonths,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);
  return m ?? null;
}
