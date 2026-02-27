import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * POST /api/billing/cancel-downgrade
 *
 * Cancels a scheduled plan downgrade.
 * Clears `pendingPlanDowngrade` on the merchant.
 */
export async function POST() {
  try {
    const merchantId = await getMerchantId();

    const [merchant] = await db
      .select({
        plan: merchants.plan,
        pendingPlanDowngrade: merchants.pendingPlanDowngrade,
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

    if (!merchant.pendingPlanDowngrade) {
      return NextResponse.json(
        { error: "Aucune rétrogradation planifiée à annuler." },
        { status: 400 }
      );
    }

    const cancelledDowngrade = merchant.pendingPlanDowngrade;

    // Clear the pending downgrade
    await db
      .update(merchants)
      .set({ pendingPlanDowngrade: null })
      .where(eq(merchants.id, merchantId));

    // Audit log (Art. 23)
    await db.insert(auditLogs).values({
      merchantId,
      actor: "merchant",
      action: "cancel_downgrade",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        cancelledDowngradeTo: cancelledDowngrade,
        currentPlan: merchant.plan,
      }),
    });

    return NextResponse.json({
      data: {
        type: "downgrade_cancelled",
        currentPlan: merchant.plan,
        message: "La rétrogradation planifiée a été annulée. Vous conservez votre plan actuel.",
      },
    });
  } catch (err) {
    console.error("[Billing] Cancel downgrade error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de la rétrogradation." },
      { status: 500 }
    );
  }
}
