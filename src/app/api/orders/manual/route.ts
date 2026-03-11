import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { processIncomingOrder } from "@/lib/ingest";
import { QuotaExceededError } from "@/lib/quota";

/**
 * Manual order entry schema — submitted from the dashboard form.
 * Simpler than the ingest schema: ref is auto-generated.
 */
const manualOrderSchema = z.object({
  phone: z.string().min(5, "Numéro de téléphone requis (min 5 caractères)"),
  customerName: z.string().optional(),
  total: z.number().positive("Le montant doit être positif"),
  city: z.string().optional(),
  address: z.string().optional(),
  product: z.string().optional(),
  productCategory: z.string().optional(),
  quantity: z.number().int().positive().optional(),
});

/**
 * POST /api/orders/manual
 * Manual order entry from the dashboard — session auth (no API key needed).
 * Calls processIncomingOrder() directly (no webhook queue).
 */
export async function POST(request: Request) {
  try {
    // ── 1. Session auth ──
    const merchantId = await getMerchantId();

    // ── 2. Parse & validate ──
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "JSON invalide" },
        { status: 400 }
      );
    }

    const parsed = manualOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Erreur de validation",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // ── 3. Load merchant settings ──
    const [merchant] = await db
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

    if (!merchant) {
      return NextResponse.json(
        { error: "Marchand introuvable" },
        { status: 404 }
      );
    }

    // ── 4. Generate ref ──
    const ref = `MAN-${Date.now().toString(36).toUpperCase()}`;

    // ── 5. Process order (direct — no queue) ──
    const result = await processIncomingOrder({
      merchantId,
      merchant: {
        verifyThreshold: merchant.verifyThreshold,
        flagThreshold: merchant.flagThreshold,
        blockThreshold: merchant.blockThreshold,
        autoBlockEnabled: merchant.autoBlockEnabled,
        escalationConfig: merchant.escalationConfig,
        dataRetentionMonths: merchant.dataRetentionMonths,
      },
      phone: data.phone,
      customerName: data.customerName,
      customerCity: data.city,
      ref,
      total: data.total,
      currency: "MAD",
      productName: data.product,
      productCategory: data.productCategory,
      quantity: data.quantity,
      shippingCity: data.city,
      shippingAddress: data.address,
      orderHour: new Date().getHours(),
    });

    return NextResponse.json({
      success: true,
      ref,
      ...result,
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: "Quota dépassé",
          reason: error.quota.reason,
          current: error.quota.current,
          limit: error.quota.limit,
        },
        { status: 429 }
      );
    }

    console.error("[Manual Order] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
