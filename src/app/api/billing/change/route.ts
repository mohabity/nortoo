import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";
import { getPlanConfig, type PlanId } from "@/lib/plans";
import { auth } from "@/auth";

const changePlanSchema = z.object({
  plan: z.enum(["starter", "pro", "scale"]),
});

/**
 * POST /api/billing/change
 * MVP plan change (no Stripe). Updates the merchant's plan in DB.
 */
export async function POST(request: Request) {
  try {
    const merchantId = await getMerchantId();
    const session = await auth();
    const userId = session?.user?.userId ?? null;

    const body = await request.json();
    const parsed = changePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Plan invalide. Valeurs acceptées : starter, pro, scale." },
        { status: 400 }
      );
    }

    const newPlan = parsed.data.plan as PlanId;

    // Fetch current plan
    const [current] = await db
      .select({ plan: merchants.plan })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!current) {
      return NextResponse.json(
        { error: "Marchand introuvable" },
        { status: 404 }
      );
    }

    const currentPlan = current.plan as PlanId;

    if (currentPlan === newPlan) {
      return NextResponse.json(
        { error: "Vous êtes déjà sur ce plan." },
        { status: 400 }
      );
    }

    // Update plan — clear trialEndsAt and set billingStatus to active when upgrading
    const updateData: Record<string, unknown> = {
      plan: newPlan,
      billingStatus: "active",
      updatedAt: new Date(),
    };

    if (currentPlan === "trial") {
      updateData.trialEndsAt = null;
    }

    await db
      .update(merchants)
      .set(updateData)
      .where(eq(merchants.id, merchantId));

    // Audit log
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "plan_change",
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify({
        from: currentPlan,
        to: newPlan,
      }),
    });

    return NextResponse.json({
      status: "changed",
      from: currentPlan,
      to: newPlan,
      config: getPlanConfig(newPlan),
    });
  } catch (err) {
    console.error("[Billing] Plan change error:", err);
    return NextResponse.json(
      { error: "Erreur lors du changement de plan." },
      { status: 500 }
    );
  }
}
