import { NextResponse } from "next/server";
import { z } from "zod";
import { extractApiKey, validateApiKey } from "@/lib/api-key";
import { webhookLimiter, safeLimit } from "@/lib/rate-limit";
import { enqueueWebhook, processWebhook } from "@/lib/webhook-processor";
import { QuotaExceededError } from "@/lib/quota";
import { MAX_BODY_SIZE } from "@/lib/constants";

/**
 * Universal ingest payload schema — quick validation before enqueue.
 */
const ingestSchema = z.object({
  ref: z.string().min(1, "ref is required"),
  customer: z.object({
    phone: z.string().min(5, "customer.phone is required"),
    name: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
  }),
  total: z.number().positive("total must be positive"),
  currency: z.string().default("MAD"),
  product: z.string().optional(),
  product_id: z.string().optional(),
  product_category: z.string().optional(),
  product_price: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
  shipping_city: z.string().optional(),
  shipping_address: z.string().optional(),
});

/**
 * POST /api/webhook/ingest
 * Universal order ingestion endpoint.
 * Auth: x-nortoo-key header or ?key= query param.
 *
 * New flow: Validate → Enqueue → 200 OK → process optimistically.
 */
export async function POST(request: Request) {
  try {
    // ── 1. Auth by API key (header only — no query param for custom integrations) ──
    const apiKey = extractApiKey(request, { allowQueryParam: false });
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key. Set x-nortoo-key header." },
        { status: 401 }
      );
    }

    const merchant = await validateApiKey(apiKey);
    if (!merchant) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // ── Rate limiting per API key ──
    {
      const { success, reset } = await safeLimit(webhookLimiter, `wh:${apiKey.slice(0, 16)}`);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    // ── 2. Parse & validate payload (with size limit) ──
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    let rawBody: string;
    let body: unknown;
    try {
      rawBody = await request.text();
      if (rawBody.length > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: "Payload too large" },
          { status: 413 }
        );
      }
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = ingestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    // ── 3. Enqueue webhook (fast INSERT) ──
    const relevantHeaders = JSON.stringify({
      "content-type": request.headers.get("content-type"),
    });

    const queueId = await enqueueWebhook({
      merchantId: merchant.id,
      source: "ingest",
      payload: rawBody,
      headers: relevantHeaders,
    });

    if (queueId === null) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // ── 4. Process immediately (optimistic) ──
    try {
      await processWebhook(queueId);
    } catch (error) {
      // Quota exceeded → return 429
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
      console.error(
        `[Webhook Ingest] Immediate processing failed for queue ${queueId}, will retry:`,
        error
      );
    }

    // ── 5. Always return 200 ──
    return NextResponse.json({ received: true, queueId });
  } catch (error) {
    console.error("[Webhook Ingest] Critical failure:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
