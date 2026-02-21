import { NextResponse } from "next/server";
import { extractApiKey, validateApiKey } from "@/lib/api-key";
import { webhookLimiter, isRateLimitConfigured } from "@/lib/rate-limit";
import { verifyWebhookSignature } from "@/lib/webhook-verify";
import { enqueueWebhook, processWebhook } from "@/lib/webhook-processor";
import type { YouCanOrderPayload } from "@/types/youcan";

/**
 * POST /api/webhook/youcan
 * Receives YouCan order.create webhooks.
 * Auth: x-nortoo-key header or ?key= query param.
 *
 * New flow: Enqueue immediately → 200 OK → process optimistically.
 * If processing fails, the cron retry will pick it up.
 */
export async function POST(request: Request) {
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
      const { success } = await webhookLimiter.limit(`wh:${apiKey.slice(0, 16)}`);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }
    }

    // ── 2. Read raw body ──
    let rawBody: string;
    let payload: YouCanOrderPayload;
    try {
      rawBody = await request.text();
      payload = JSON.parse(rawBody);
    } catch {
      console.error("[Webhook YouCan] Invalid JSON body");
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // ── 2b. HMAC signature verification (if configured) ──
    const webhookSecret = process.env.YOUCAN_WEBHOOK_SECRET;
    const signature = request.headers.get("x-youcan-signature");
    if (webhookSecret) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("[Webhook YouCan] Invalid HMAC signature");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 403 }
        );
      }
    } else if (signature) {
      // Secret not configured but signature present — log for visibility
      console.warn(
        "[Webhook YouCan] x-youcan-signature present but YOUCAN_WEBHOOK_SECRET not set — skipping verification"
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
    const gateway = payload.payment?.payload?.gateway;
    if (gateway && gateway !== "cod") {
      console.log("[Webhook YouCan] Non-COD order ignored, gateway:", gateway);
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
