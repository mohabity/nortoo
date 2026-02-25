import { NextResponse } from "next/server";
import { z } from "zod";
import { extractApiKey, validateApiKey } from "@/lib/api-key";
import { webhookLimiter, isRateLimitConfigured } from "@/lib/rate-limit";
import { verifyWebhookSignature } from "@/lib/webhook-verify";
import { enqueueWebhook, processWebhook } from "@/lib/webhook-processor";
import { QuotaExceededError } from "@/lib/quota";
import { isCodGateway } from "@/lib/order-pipeline";
import { db } from "@/db/index";
import { auditLogs } from "@/db/schema";
import type { YouCanOrderPayload } from "@/types/youcan";

/** Max body size: 1 MB */
const MAX_BODY_SIZE = 1_048_576;

/**
 * Zod schema — validates the minimal structure expected from YouCan webhooks.
 * `.passthrough()` allows extra fields we don't validate (forward-compatible).
 */
const youcanPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  ref: z.string().optional(),
  total: z.union([z.number(), z.string()]),
  payment: z.object({
    payload: z.object({
      gateway: z.string().optional(),
    }).passthrough().optional(),
    address: z.array(z.any()).optional(),
  }).passthrough().optional(),
  customer: z.object({
    phone: z.string().optional(),
  }).passthrough().optional(),
  shipping: z.object({
    address: z.array(z.any()).optional(),
  }).passthrough().optional(),
}).passthrough();

/**
 * POST /api/webhook/youcan
 * Receives YouCan order.create webhooks.
 * Auth: x-nortoo-key header or ?key= query param.
 *
 * New flow: Enqueue immediately → 200 OK → process optimistically.
 * If processing fails, the cron retry will pick it up.
 */
export async function POST(request: Request) {
  // ── 0. Catch-all log — proves YouCan is calling us ──
  const reqUrl = request.url;
  const reqHeaders = Object.fromEntries(
    ["content-type", "x-youcan-signature", "x-nortoo-key", "x-codpilot-key", "user-agent"]
      .map((h) => [h, request.headers.get(h)])
      .filter(([, v]) => v)
  );
  console.log("[Webhook YouCan] ── INCOMING ──", JSON.stringify({ url: reqUrl, headers: reqHeaders }));

  try {
    // ── 1. Auth by API key (fast, no heavy DB) ──
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      console.error("[Webhook YouCan] Missing API key");
      return NextResponse.json(
        { error: "Missing API key. Set x-nortoo-key header or ?key= param." },
        { status: 401 }
      );
    }

    const merchant = await validateApiKey(apiKey);
    if (!merchant) {
      console.error(
        "[Webhook YouCan] Invalid API key:",
        apiKey.slice(0, 16) + "..."
      );
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // ── Rate limiting per API key ──
    if (isRateLimitConfigured()) {
      const { success, reset } = await webhookLimiter.limit(`wh:${apiKey.slice(0, 16)}`);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    // ── 2. Read raw body (with size limit) ──
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      console.error(`[Webhook YouCan] Payload too large: ${contentLength} bytes`);
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    let rawBody: string;
    let payload: YouCanOrderPayload;
    try {
      rawBody = await request.text();
      if (rawBody.length > MAX_BODY_SIZE) {
        console.error(`[Webhook YouCan] Payload too large after read: ${rawBody.length} chars`);
        return NextResponse.json(
          { error: "Payload too large" },
          { status: 413 }
        );
      }
      const parsed = youcanPayloadSchema.safeParse(JSON.parse(rawBody));
      if (!parsed.success) {
        console.error("[Webhook YouCan] Zod validation failed:", parsed.error.issues);
        return NextResponse.json(
          { error: "Invalid payload structure", details: parsed.error.issues },
          { status: 400 }
        );
      }
      payload = parsed.data as unknown as YouCanOrderPayload;
    } catch {
      console.error("[Webhook YouCan] Invalid JSON body");
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // ── 2b. HMAC signature verification ──
    // Per YouCan docs: signing key = OAuth Client Secret
    // Fallback to legacy YOUCAN_WEBHOOK_SECRET for backward compat
    const webhookSecret = process.env.YOUCAN_CLIENT_SECRET || process.env.YOUCAN_WEBHOOK_SECRET;
    const signature = request.headers.get("x-youcan-signature");
    if (webhookSecret && signature) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("[Webhook YouCan] Invalid HMAC signature");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 403 }
        );
      }
    } else if (signature && !webhookSecret) {
      // Signature present but no secret configured — log for visibility
      console.warn(
        "[Webhook YouCan] x-youcan-signature present but no signing key available — skipping verification"
      );
    }

    // Log for debugging
    console.log("[Webhook YouCan] Received:", {
      id: payload.id,
      ref: payload.ref,
      total: payload.total,
      gateway: payload.payment?.payload?.gateway,
      merchantId: merchant.id,
    });

    // ── 3. Filter COD only ──
    const gateway =
      payload.payment?.gateway_type ??
      payload.payment?.payload?.gateway;
    if (!isCodGateway(gateway)) {
      console.log("[Webhook YouCan] Non-COD order ignored, gateway:", gateway);
      // Audit log so merchants can see why an order was rejected
      db.insert(auditLogs).values({
        merchantId: merchant.id,
        actor: "system",
        action: "order_rejected",
        targetType: "webhook",
        targetId: payload.id || payload.ref || "unknown",
        details: JSON.stringify({
          reason: "non_cod",
          gateway,
          ref: payload.ref,
          customerName: `${payload.customer?.first_name ?? ""} ${payload.customer?.last_name ?? ""}`.trim(),
          total: payload.total,
        }),
      }).catch((e) => console.error("[Webhook YouCan] Audit log error:", e));
      return NextResponse.json({
        data: null,
        message: "Non-COD order ignored",
      });
    }

    // ── 4. Quick validation: phone required ──
    const phone =
      payload.customer?.phone ||
      payload.shipping?.address?.[0]?.phone ||
      payload.payment?.address?.[0]?.phone;

    if (!phone) {
      console.error("[Webhook YouCan] No phone found in payload");
      // Audit log so merchants can see why an order was rejected
      db.insert(auditLogs).values({
        merchantId: merchant.id,
        actor: "system",
        action: "order_rejected",
        targetType: "webhook",
        targetId: payload.id || payload.ref || "unknown",
        details: JSON.stringify({
          reason: "missing_phone",
          ref: payload.ref,
          customerName: `${payload.customer?.first_name ?? ""} ${payload.customer?.last_name ?? ""}`.trim(),
          total: payload.total,
        }),
      }).catch((e) => console.error("[Webhook YouCan] Audit log error:", e));
      return NextResponse.json(
        { error: "Customer phone is required" },
        { status: 400 }
      );
    }

    // ── 5. Enqueue webhook (fast INSERT) ──
    const relevantHeaders = JSON.stringify({
      "content-type": request.headers.get("content-type"),
      "x-youcan-signature": request.headers.get("x-youcan-signature"),
    });

    const queueId = await enqueueWebhook({
      merchantId: merchant.id,
      source: "youcan",
      payload: rawBody,
      headers: relevantHeaders,
    });

    if (queueId === null) {
      // Duplicate webhook
      return NextResponse.json({ received: true, duplicate: true });
    }

    // ── 6. Process immediately (optimistic) ──
    try {
      await processWebhook(queueId);
    } catch (error) {
      // Quota exceeded → return 429 so YouCan knows order wasn't processed
      if (error instanceof QuotaExceededError) {
        return NextResponse.json(
          {
            status: "quota_exceeded",
            reason: error.quota.reason,
            current: error.quota.current,
            limit: error.quota.limit,
          },
          { status: 429 }
        );
      }
      // Processing failed, but webhook is enqueued — retry cron will handle it
      console.error(
        `[Webhook YouCan] Immediate processing failed for queue ${queueId}, will retry:`,
        error
      );
    }

    // ── 7. Always return 200 (webhook is safely enqueued) ──
    return NextResponse.json({ received: true, queueId });
  } catch (error) {
    // Critical failure (even enqueue failed)
    console.error("[Webhook YouCan] Critical failure:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
