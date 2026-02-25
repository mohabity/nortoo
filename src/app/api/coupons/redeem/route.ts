import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";
import { auth } from "@/auth";
import { redeemCoupon } from "@/lib/coupons";

const schema = z.object({
  code: z.string().min(1).max(50),
});

/**
 * POST /api/coupons/redeem
 * Body: { code: "PROMO30" }
 * Auth required. NOT blocked by paywall (must work for expired trials).
 */
export async function POST(request: Request) {
  try {
    const merchantId = await getMerchantId();

    let userId: number | undefined;
    try {
      const session = await auth();
      userId = session?.user?.userId;
    } catch { /* non-critical */ }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const result = await redeemCoupon(merchantId, parsed.data.code, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      message: result.message,
      effect: result.effect,
    });
  } catch (err) {
    console.error("[Coupons] Redeem error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
