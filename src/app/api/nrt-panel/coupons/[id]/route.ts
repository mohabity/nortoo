import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";

/**
 * DELETE /api/nrt-panel/coupons/[id]
 * Deactivate a coupon (soft delete).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const couponId = parseInt(id, 10);

  if (isNaN(couponId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const [coupon] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.id, couponId))
    .limit(1);

  if (!coupon) {
    return NextResponse.json({ error: "Coupon introuvable" }, { status: 404 });
  }

  await db
    .update(coupons)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(coupons.id, couponId));

  return NextResponse.json({ status: "deactivated" });
}
