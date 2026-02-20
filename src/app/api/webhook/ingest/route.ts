import { NextResponse } from "next/server";
import { z } from "zod";
import { extractApiKey, validateApiKey } from "@/lib/api-key";
import { processIncomingOrder } from "@/lib/ingest";

/**
 * Universal ingest payload schema.
 * Works with any source: YouCan, Shopify, WooCommerce, or custom.
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
 * Auth: x-codpilot-key header or ?key= query param.
 * Accepts a simplified JSON payload and runs the full scoring pipeline.
 */
export async function POST(request: Request) {
  // ── 1. Auth by API key ──
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key. Set x-codpilot-key header or ?key= param." },
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

  // ── 2. Parse & validate payload ──
  let body: unknown;
  try {
    body = await request.json();
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

  const data = parsed.data;

  // ── 3. Run shared pipeline ──
  const shippingCity = data.shipping_city || data.customer.city || undefined;
  const shippingAddress = data.shipping_address || data.customer.address || undefined;

  const result = await processIncomingOrder({
    merchantId: merchant.id,
    merchant: {
      verifyThreshold: merchant.verifyThreshold,
      flagThreshold: merchant.flagThreshold,
      blockThreshold: merchant.blockThreshold,
      autoBlockEnabled: merchant.autoBlockEnabled,
      dataRetentionMonths: merchant.dataRetentionMonths,
    },
    phone: data.customer.phone,
    customerName: data.customer.name,
    customerCity: data.customer.city,
    ref: data.ref,
    total: data.total,
    currency: data.currency,
    productName: data.product,
    productId: data.product_id,
    productCategory: data.product_category,
    productPrice: data.product_price,
    quantity: data.quantity,
    shippingCity,
    shippingAddress,
    orderHour: new Date().getHours(),
  });

  return NextResponse.json({ data: result });
}
