import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { coupons, couponRedemptions, merchants } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";

const createSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  type: z.enum(["trial_extension", "first_month_free"]),
  value: z.string().min(1),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET /api/admin/coupons
 * List all coupons with redemption details.
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));

  // Fetch redemptions for each coupon
  const redemptions = await db
    .select({
      couponId: couponRedemptions.couponId,
      merchantId: couponRedemptions.merchantId,
      merchantName: merchants.name,
      merchantEmail: merchants.email,
      redeemedAt: couponRedemptions.redeemedAt,
      effect: couponRedemptions.effect,
    })
    .from(couponRedemptions)
    .innerJoin(merchants, eq(couponRedemptions.merchantId, merchants.id))
    .orderBy(desc(couponRedemptions.redeemedAt));

  // Group redemptions by coupon
  const redemptionMap = new Map<number, typeof redemptions>();
  for (const r of redemptions) {
    const list = redemptionMap.get(r.couponId) ?? [];
    list.push(r);
    redemptionMap.set(r.couponId, list);
  }

  const data = rows.map((c) => ({
    ...c,
    redemptions: redemptionMap.get(c.id) ?? [],
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/admin/coupons
 * Create a new coupon. Auto-generates code if not provided.
 */
export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const code = (
    parsed.data.code || randomBytes(6).toString("hex")
  ).toUpperCase();
  const expiresAt = parsed.data.expiresAt
    ? new Date(parsed.data.expiresAt)
    : null;

  // Check for duplicate code
  const [existing] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: `Le code "${code}" existe déjà` },
      { status: 409 }
    );
  }

  const [coupon] = await db
    .insert(coupons)
    .values({
      code,
      type: parsed.data.type,
      value: parsed.data.value,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt,
      createdBy: "admin",
    })
    .returning();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json(
    {
      data: coupon,
      redeemUrl: `${appUrl}/redeem?code=${coupon.code}`,
    },
    { status: 201 }
  );
}
