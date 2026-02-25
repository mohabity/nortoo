import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

/**
 * GET /api/coupons/validate?code=PROMO30
 * Public (no auth required) — used by /redeem page to show coupon details.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const coupon = await validateCoupon(code);

  if (!coupon) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    type: coupon.type,
    description: coupon.description,
  });
}
