import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, invoices, auditLogs } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";
import { getPlanConfig, PLAN_ORDER, type PlanId } from "@/lib/plans";
import {
  calculateAmounts,
  generateInvoiceNumber,
  PAYMENT_TERMS_DAYS,
  BANK_INFO,
} from "@/lib/billing-config";

const changePlanSchema = z.object({
  plan: z.enum(["starter", "pro", "scale"]),
});

/**
 * POST /api/billing/change
 *
 * Self-service plan upgrade via bank transfer (virement bancaire).
 * Creates a pending proforma invoice for the chosen plan.
 * The merchant then transfers the amount; admin confirms payment → auto-upgrade.
 *
 * Downgrades are not supported self-service — contact support.
 */
export async function POST(request: Request) {
  try {
    const merchantId = await getMerchantId();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "JSON invalide" },
        { status: 400 }
      );
    }

    const parsed = changePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Plan invalide. Choisissez starter, pro ou scale." },
        { status: 400 }
      );
    }

    const newPlan = parsed.data.plan;

    // Fetch current merchant info
    const [merchant] = await db
      .select({
        plan: merchants.plan,
        billingStatus: merchants.billingStatus,
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

    const currentPlan = merchant.plan as PlanId;
    const currentIdx = PLAN_ORDER.indexOf(currentPlan);
    const newIdx = PLAN_ORDER.indexOf(newPlan);

    // Block downgrades
    if (newIdx <= currentIdx && currentPlan !== "trial") {
      return NextResponse.json(
        {
          error: "Pour passer à un plan inférieur, contactez support@nortoo.ma.",
          code: "DOWNGRADE_NOT_SUPPORTED",
        },
        { status: 400 }
      );
    }

    // Same plan (already on this plan and active)
    if (newPlan === currentPlan && merchant.billingStatus === "active") {
      return NextResponse.json(
        { error: "Vous êtes déjà sur ce plan." },
        { status: 400 }
      );
    }

    // Check for existing pending invoice for an upgrade (prevent duplicates)
    const [existingPending] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        planAtInvoice: invoices.planAtInvoice,
        amountTTC: invoices.amountTTC,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.merchantId, merchantId),
          eq(invoices.status, "pending"),
          eq(invoices.planAtInvoice, newPlan)
        )
      )
      .limit(1);

    if (existingPending) {
      return NextResponse.json(
        {
          error: "Une demande d'upgrade vers ce plan est déjà en cours.",
          code: "UPGRADE_PENDING",
          existingInvoice: {
            invoiceNumber: existingPending.invoiceNumber,
            amountTTC: existingPending.amountTTC,
          },
        },
        { status: 409 }
      );
    }

    // Calculate amounts
    const planConfig = getPlanConfig(newPlan);
    const priceHT = planConfig.price * 100; // DH to centimes
    const amounts = calculateAmounts(priceHT);

    // Generate invoice number
    const [countResult] = await db.select({ cnt: count() }).from(invoices);
    const sequence = Number(countResult.cnt) + 1;
    const invoiceNumber = generateInvoiceNumber(sequence);

    // Due date
    const now = new Date();
    const dueDate = new Date(
      now.getTime() + PAYMENT_TERMS_DAYS * 24 * 60 * 60 * 1000
    );
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Create pending invoice (proforma)
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        merchantId,
        invoiceNumber,
        period,
        planAtInvoice: newPlan,
        amountHT: amounts.amountHT,
        tvaRate: 20,
        amountTVA: amounts.amountTVA,
        amountTTC: amounts.amountTTC,
        status: "pending",
        dueDate,
      })
      .returning({ id: invoices.id });

    // Audit log (Art. 23 Loi 09-08)
    await db.insert(auditLogs).values({
      merchantId,
      actor: "merchant",
      action: "change_plan",
      targetType: "invoice",
      targetId: String(newInvoice.id),
      details: JSON.stringify({
        fromPlan: currentPlan,
        toPlan: newPlan,
        invoiceNumber,
        amountTTC: amounts.amountTTC,
      }),
    });

    return NextResponse.json({
      data: {
        invoiceId: newInvoice.id,
        invoiceNumber,
        plan: newPlan,
        planName: planConfig.name,
        amountHT: amounts.amountHT,
        amountTVA: amounts.amountTVA,
        amountTTC: amounts.amountTTC,
        dueDate: dueDate.toISOString(),
        bankInfo: BANK_INFO,
      },
    });
  } catch (err) {
    console.error("[Billing] Plan change error:", err);
    return NextResponse.json(
      { error: "Erreur lors du changement de plan." },
      { status: 500 }
    );
  }
}
