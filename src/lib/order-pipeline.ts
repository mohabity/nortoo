/**
 * Order Pipeline — Parse YouCan/Ingest payloads into IngestParams.
 *
 * These functions extract the parsing logic from the route handlers
 * so the webhook processor can reuse them for retries.
 */

import type { IngestParams } from "@/lib/ingest";
import type { YouCanOrderPayload } from "@/types/youcan";

interface MerchantSettings {
  id: number;
  verifyThreshold: number;
  flagThreshold: number;
  blockThreshold: number;
  autoBlockEnabled: boolean;
  dataRetentionMonths: number;
}

/**
 * Parse a YouCan webhook payload into IngestParams.
 * Extracts phone, name, address, city, product info from the YouCan format.
 */
export function parseYouCanPayload(
  payload: YouCanOrderPayload,
  merchant: MerchantSettings
): IngestParams {
  // Phone: from customer object, or from shipping/payment address
  const phone =
    payload.customer?.phone ||
    payload.shipping?.address?.[0]?.phone ||
    payload.payment?.address?.[0]?.phone;

  if (!phone) {
    throw new Error("Customer phone is required (YouCan payload)");
  }

  // Customer name
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

  // City
  const shippingCity =
    payload.shipping?.address?.[0]?.city ||
    payload.customer?.city ||
    undefined;

  // Address — must be a string
  const rawAddr =
    payload.shipping?.address?.[0]?.address || payload.customer?.address;
  const shippingAddress = typeof rawAddr === "string" ? rawAddr : undefined;

  // Product info from variants
  const productName =
    payload.variants
      ?.map((v) => v.variant?.product?.name)
      .filter(Boolean)
      .join(", ") ||
    payload.items?.map((i) => i.name).join(", ") ||
    undefined;

  const productId = payload.variants?.[0]?.variant?.product?.id || undefined;
  const productPrice = payload.variants?.[0]?.variant?.price ?? undefined;
  const productQuantity =
    payload.variants?.reduce((sum, v) => sum + (v.quantity ?? 1), 0) ??
    undefined;

  const orderHour = payload.created_at
    ? new Date(payload.created_at).getHours()
    : new Date().getHours();

  return {
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
  };
}

/**
 * Parse a universal ingest payload into IngestParams.
 * Expected shape: { ref, customer: { phone, name?, city?, address? }, total, ... }
 */
export function parseIngestPayload(
  payload: Record<string, unknown>,
  merchant: MerchantSettings
): IngestParams {
  const customer = payload.customer as
    | { phone: string; name?: string; city?: string; address?: string }
    | undefined;

  if (!customer?.phone) {
    throw new Error("customer.phone is required (ingest payload)");
  }

  const shippingCity =
    (payload.shipping_city as string) || customer.city || undefined;
  const shippingAddress =
    (payload.shipping_address as string) || customer.address || undefined;

  return {
    merchantId: merchant.id,
    merchant: {
      verifyThreshold: merchant.verifyThreshold,
      flagThreshold: merchant.flagThreshold,
      blockThreshold: merchant.blockThreshold,
      autoBlockEnabled: merchant.autoBlockEnabled,
      dataRetentionMonths: merchant.dataRetentionMonths,
    },
    phone: customer.phone,
    customerName: customer.name,
    customerCity: customer.city,
    ref: (payload.ref as string) || "unknown",
    total: (payload.total as number) || 0,
    currency: (payload.currency as string) || "MAD",
    productName: payload.product as string | undefined,
    productId: payload.product_id as string | undefined,
    productCategory: payload.product_category as string | undefined,
    productPrice: payload.product_price as number | undefined,
    quantity: payload.quantity as number | undefined,
    shippingCity,
    shippingAddress,
    orderHour: new Date().getHours(),
  };
}
