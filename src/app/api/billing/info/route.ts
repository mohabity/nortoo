import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requirePermission, handlePermissionError } from "@/lib/permissions";

const updateSchema = z.object({
  billingName: z.string().max(200).optional(),
  billingAddress: z.string().max(500).optional(),
  billingICE: z.string().max(30).optional(),
});

/**
 * GET /api/billing/info
 * Return billing info for the authenticated merchant.
 */
export async function GET() {
  let ctx;
  try {
    ctx = await requirePermission("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }

  const [merchant] = await db
    .select({
      billingName: merchants.billingName,
      billingAddress: merchants.billingAddress,
      billingICE: merchants.billingICE,
    })
    .from(merchants)
    .where(eq(merchants.id, ctx.merchantId))
    .limit(1);

  return NextResponse.json({ data: merchant });
}

/**
 * PUT /api/billing/info
 * Update billing info for the authenticated merchant.
 */
export async function PUT(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  await db
    .update(merchants)
    .set({
      billingName: parsed.data.billingName ?? null,
      billingAddress: parsed.data.billingAddress ?? null,
      billingICE: parsed.data.billingICE ?? null,
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, ctx.merchantId));

  return NextResponse.json({ data: { status: "updated" } });
}
