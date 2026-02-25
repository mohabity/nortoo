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
 *
 * Self-service plan changes are DISABLED.
 * Plan changes require payment via Stripe (future) or admin action.
 * Merchants can use a coupon to upgrade (POST /api/coupons/redeem).
 */
export async function POST(request: Request) {
  try {
    const merchantId = await getMerchantId();

    // Self-service plan changes blocked — payment required
    return NextResponse.json(
      {
        error: "Le changement de plan nécessite un paiement. Contactez support@nortoo.ma ou utilisez un coupon.",
        code: "PAYMENT_REQUIRED",
      },
      { status: 402 }
    );
  } catch (err) {
    console.error("[Billing] Plan change error:", err);
    return NextResponse.json(
      { error: "Erreur lors du changement de plan." },
      { status: 500 }
    );
  }
}
