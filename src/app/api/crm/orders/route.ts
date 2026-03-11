import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { processIncomingOrder } from "@/lib/ingest";
import {
  requireActiveMerchant,
  handlePermissionError,
} from "@/lib/permissions";

const createOrderSchema = z.object({
  phone: z.string().min(5, "Numéro de téléphone requis"),
  name: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  product: z.string().optional(),
  productId: z.string().optional(),
  productCategory: z.string().optional(),
  productPrice: z.number().positive().optional(),
  quantity: z.number().int().positive().optional(),
  total: z.number().positive("Montant requis"),
  currency: z.string().default("MAD"),
});

/**
 * POST /api/crm/orders — Create a manual CRM order and score it
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveMerchant("orders:write");
    const { merchantId } = ctx;

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Fetch merchant scoring config
    const [merchant] = await db
      .select({
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

    // Generate CRM order ref
    const ref = `CRM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

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
      customerName: data.name,
      customerCity: data.city,
      ref,
      total: data.total,
      currency: data.currency,
      productName: data.product,
      productId: data.productId,
      productCategory: data.productCategory,
      productPrice: data.productPrice,
      quantity: data.quantity,
      shippingCity: data.city,
      shippingAddress: data.address,
      orderHour: new Date().getHours(),
      source: "crm",
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: err.errors },
        { status: 400 }
      );
    }
    return (
      handlePermissionError(err) ??
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Erreur serveur" },
        { status: 500 }
      )
    );
  }
}
