import { NextResponse } from "next/server";
import { extractApiKey, validateApiKey } from "@/lib/api-key";
import { processIncomingOrder } from "@/lib/ingest";
import type { YouCanOrderPayload } from "@/types/youcan";

/**
 * POST /api/webhook/youcan
 * Receives YouCan order.create webhooks.
 * Auth: x-codpilot-key header or ?key= query param.
 * Filters COD orders only, then runs the full scoring pipeline.
 */
export async function POST(request: Request) {
  // ── 1. Auth by API key ──
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    console.error("[Webhook YouCan] Missing API key");
    return NextResponse.json(
      { error: "Missing API key. Set x-codpilot-key header or ?key= param." },
      { status: 401 }
    );
  }

  const merchant = await validateApiKey(apiKey);
  if (!merchant) {
    console.error("[Webhook YouCan] Invalid API key:", apiKey.slice(0, 16) + "...");
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  // ── 2. Parse payload ──
  let payload: YouCanOrderPayload;
  let rawBody: string;
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

  // Log raw payload for debugging (first 2000 chars)
  console.log("[Webhook YouCan] RAW:", rawBody.slice(0, 2000));

  console.log("[Webhook YouCan] Parsed:", {
    id: payload.id,
    ref: payload.ref,
    total: payload.total,
    gateway: payload.payment?.payload?.gateway,
    paymentStatus: payload.payment?.status_text,
    hasCustomer: !!payload.customer,
    customerPhone: payload.customer?.phone ? "***" + payload.customer.phone.slice(-4) : "none",
    variantsCount: payload.variants?.length ?? 0,
    merchantId: merchant.id,
  });

  // ── 3. Filter COD only ──
  // YouCan nests gateway inside payment.payload.gateway (not payment.gateway)
  const gateway = payload.payment?.payload?.gateway;

  if (gateway && gateway !== "cod") {
    console.log("[Webhook YouCan] Non-COD order ignored, gateway:", gateway);
    return NextResponse.json({
      data: null,
      message: "Non-COD order ignored",
    });
  }

  if (!gateway) {
    console.log("[Webhook YouCan] No gateway info, processing anyway");
  }

  // ── 4. Extract data from YouCan format ──
  // Phone: from customer object, or from shipping/payment address
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

  // Customer name: from customer object or shipping address
  const customerName =
    [payload.customer?.first_name, payload.customer?.last_name]
      .filter(Boolean)
      .join(" ") ||
    [
      payload.shipping?.address?.[0]?.first_name,
      payload.shipping?.address?.[0]?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    undefined;

  // City: from shipping address array, or customer object
  const shippingCity =
    payload.shipping?.address?.[0]?.city ||
    payload.customer?.city ||
    undefined;

  // Address: MUST be a string — YouCan shipping.address is an array of objects,
  // but customer.address is a string. Ensure we always pass a string.
  const rawAddr =
    payload.shipping?.address?.[0]?.address ||
    payload.customer?.address;
  const shippingAddress = typeof rawAddr === "string" ? rawAddr : undefined;

  // Product name: from variants (YouCan uses variants, not items)
  const productName =
    payload.variants
      ?.map((v) => v.variant?.product?.name)
      .filter(Boolean)
      .join(", ") ||
    payload.items?.map((i) => i.name).join(", ") ||
    undefined;

  // Product details: ID, price, quantity from variants
  const productId = payload.variants?.[0]?.variant?.product?.id || undefined;
  const productPrice = payload.variants?.[0]?.variant?.price ?? undefined;
  const productQuantity = payload.variants?.reduce(
    (sum, v) => sum + (v.quantity ?? 1), 0
  ) ?? undefined;

  const orderHour = payload.created_at
    ? new Date(payload.created_at).getHours()
    : new Date().getHours();

  console.log("[Webhook YouCan] Extracted:", {
    phone: "***" + phone.slice(-4),
    customerName,
    shippingCity,
    shippingAddress: shippingAddress ? shippingAddress.slice(0, 50) : "none",
    productName,
    orderHour,
  });

  // ── 5. Run shared pipeline ──
  try {
    const result = await processIncomingOrder({
      merchantId: merchant.id,
      merchant: {
        verifyThreshold: merchant.verifyThreshold,
        flagThreshold: merchant.flagThreshold,
        blockThreshold: merchant.blockThreshold,
        autoBlockEnabled: merchant.autoBlockEnabled,
        dataRetentionMonths: merchant.dataRetentionMonths,
      },
      phone,
      customerName,
      customerCity: payload.customer?.city || shippingCity,
      ref: payload.ref || `yc_${payload.id}`,
      externalId: payload.id,
      total: payload.total,
      currency: payload.currency || "MAD",
      productName,
      productId,
      productPrice,
      quantity: productQuantity,
      shippingCity,
      shippingAddress,
      orderHour,
    });

    console.log("[Webhook YouCan] Order scored:", {
      orderId: result.orderId,
      score: result.score,
      decision: result.decision,
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[Webhook YouCan] Processing error:", err);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}
