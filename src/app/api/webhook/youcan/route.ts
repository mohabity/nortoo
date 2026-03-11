import { NextResponse } from "next/server";
import { z } from "zod";
import { extractApiKeyWithSource, validateApiKey } from "@/lib/api-key";
import { webhookLimiter, safeLimit } from "@/lib/rate-limit";
import { verifyWebhookSignature } from "@/lib/webhook-verify";
import { enqueueWebhook, processWebhook } from "@/lib/webhook-processor";
import { QuotaExceededError } from "@/lib/quota";
import { isCodGateway } from "@/lib/order-pipeline";
import { db } from "@/db/index";
import { auditLogs } from "@/db/schema";
import type { YouCanOrderPayload } from "@/types/youcan";
import { MAX_BODY_SIZE } from "@/lib/constants";

/**
 * Zod schema — validates the minimal structure expected from YouCan webhooks.
 * `.passthrough()` allows extra fields we don't validate (forward-compatible).
 */
const addressSchema = z.object({
  phone: z.string().optional(),
}).passthrough();

const youcanPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  ref: z.string().optional(),
  total: z.union([z.number(), z.string()]),
  payment: z.object({
    payload: z.object({
      gateway: z.string().optional(),
    }).passthrough().optional(),
    gateway_type: z.string().optional(),
    address: z.array(addressSchema).optional(),
  }).passthrough().optional(),
  customer: z.object({
    phone: z.string().optional(),
  }).passthrough().optional(),
  shipping: z.object({
    address: z.array(addressSchema).optional(),
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
  // ── 0. Debug log (only when DEBUG_WEBHOOKS=true) ──
  if (process.env.DEBUG_WEBHOOKS === "true") {
    const safeUrl = new URL(request.url);
    safeUrl.searchParams.delete("key");
    const reqHeaders = Object.fromEntries(
      ["content-type", "x-youcan-signature", "user-agent"]
        .map((h) => [h, request.headers.get(h)])
        .filter(([, v]) => v)
    );
    console.info("[Webhook YouCan] ── INCOMING ──", JSON.stringify({ url: safeUrl.toString(), headers: reqHeaders }));
  }

  try {
    // ── 0b. Content-Type check ──
    const ct = request.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    // ── 1. Auth by API key (fast, no heavy DB) ──
    const apiKeyResult = extractApiKeyWithSource(request);
    if (!apiKeyResult) {
      console.error("[Webhook YouCan] Missing API key");
      return NextResponse.json(
        { error: "Clé API manquante. Définir x-nortoo-key header ou ?key= param." },
        { status: 401 }
      );
    }
    const apiKey = apiKeyResult.key;

    const merchant = await validateApiKey(apiKey);
    if (!merchant) {
      console.error(
        "[Webhook YouCan] Invalid API key:",
        apiKey.slice(0, 16) + "..."
      );
      return NextResponse.json(
        { error: "Clé API invalide" },
        { status: 401 }
      );
    }

    // ── Rate limiting per API key ──
    const { success: rlSuccess, reset: rlReset } = await safeLimit(webhookLimiter, `wh:${apiKey.slice(0, 16)}`);
    if (!rlSuccess) {
      const retryAfter = Math.ceil((rlReset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Limite de requêtes dépassée" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // ── 2. Read raw body (with size limit) ──
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      console.error(`[Webhook YouCan] Payload too large: ${contentLength} bytes`);
      return NextResponse.json(
        { error: "Payload trop volumineux" },
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
          { error: "Payload trop volumineux" },
          { status: 413 }
        );
      }
      const parsed = youcanPayloadSchema.safeParse(JSON.parse(rawBody));
      if (!parsed.success) {
        console.error("[Webhook YouCan] Zod validation failed:", parsed.error.issues);
        return NextResponse.json(
          { error: "Structure de payload invalide" },
          { status: 400 }
        );
      }
      payload = parsed.data as unknown as YouCanOrderPayload;
    } catch (err) {
      console.error("[Webhook YouCan] Invalid JSON body:", err);
      return NextResponse.json(
        { error: "Payload JSON invalide" },
        { status: 400 }
      );
    }

    // ── 2b. HMAC signature verification ──
    // Per YouCan docs: signing key = OAuth Client Secret
    // Fallback to legacy YOUCAN_WEBHOOK_SECRET for backward compat
    const webhookSecret = process.env.YOUCAN_CLIENT_SECRET || process.env.YOUCAN_WEBHOOK_SECRET;
    const signature = request.headers.get("x-youcan-signature");
    if (signature) {
      // Signature present → MUST verify (reject if no secret configured)
      if (!webhookSecret) {
        console.error(
          "[Webhook YouCan] x-youcan-signature present but no signing key configured — rejecting"
        );
        return NextResponse.json(
          { error: "Configuration serveur incomplète: clé de signature manquante" },
          { status: 500 }
        );
      }
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("[Webhook YouCan] Invalid HMAC signature");
        return NextResponse.json(
          { error: "Signature webhook invalide" },
          { status: 403 }
        );
      }
    } else if (!signature && webhookSecret) {
      // No signature but secret configured — warn (YouCan should always sign)
      console.warn(
        "[Webhook YouCan] No x-youcan-signature header but signing key is configured — request not signed"
      );
    }

    if (process.env.DEBUG_WEBHOOKS === "true") {
      console.info("[Webhook YouCan] Received:", {
        id: payload.id,
        ref: payload.ref,
        total: payload.total,
        gateway: payload.payment?.payload?.gateway,
        merchantId: merchant.id,
      });
    }

    // ── 3. Filter COD only ──
    const gateway =
      payload.payment?.gateway_type ??
      payload.payment?.payload?.gateway;
    if (!isCodGateway(gateway)) {
      // Audit log so merchants can see why an order was rejected
      await db.insert(auditLogs).values({
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
      }).catch((err) => console.error("[Webhook YouCan] Audit log error:", err));
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
      await db.insert(auditLogs).values({
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
        { error: "Numéro de téléphone client requis" },
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
    const response = NextResponse.json({ received: true, queueId });
    if (apiKeyResult.source === "query-param") {
      response.headers.set(
        "X-Deprecation-Warning",
        "API key via ?key= query param is deprecated. Use x-nortoo-key header instead."
      );
    }
    return response;
  } catch (error) {
    // Critical failure (even enqueue failed)
    console.error("[Webhook YouCan] Critical failure:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
