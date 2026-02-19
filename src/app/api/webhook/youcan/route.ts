import { NextResponse } from "next/server";
import { extractApiKey, validateApiKey } from "@/lib/api-key";
import { processIncomingOrder } from "@/lib/ingest";
import type { YouCanOrderPayload } from "@/types/youcan";

/**
 * POST /api/webhook/youcan
 * Receives YouCan order.created webhooks.
 * Auth: x-codpilot-key header or ?key= query param.
 * Filters COD orders only, then runs the full scoring pipeline.
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

  // ── 2. Parse payload ──
  let payload: YouCanOrderPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // ── 3. Filter COD only ──
  if (payload.payment?.gateway !== "cod") {
    return NextResponse.json({
      data: null,
      message: "Non-COD order ignored",
    });
  }

  // ── 4. Extract data from YouCan format ──
  const phone = payload.customer?.phone;
  if (!phone) {
    return NextResponse.json(
      { error: "Customer phone is required" },
      { status: 400 }
    );
  }

  const customerName = [payload.customer.first_name, payload.customer.last_name]
    .filter(Boolean)
    .join(" ") || undefined;

  const shippingCity = payload.shipping?.city || payload.customer?.city || undefined;
  const shippingAddress = payload.shipping?.address || payload.customer?.address || undefined;
  const productName = payload.items?.map((i) => i.name).join(", ") || undefined;
  const orderHour = payload.created_at
    ? new Date(payload.created_at).getHours()
    : new Date().getHours();

  // ── 5. Run shared pipeline ──
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
    customerCity: payload.customer?.city,
    ref: payload.ref || `yc_${payload.id}`,
    externalId: payload.id,
    total: payload.total,
    currency: payload.currency || "MAD",
    productName,
    shippingCity,
    shippingAddress,
    orderHour,
  });

  return NextResponse.json({ data: result });
}
