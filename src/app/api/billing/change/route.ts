import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, invoices, auditLogs } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";
import { getMerchantId } from "@/lib/merchant";
import { getPlanConfig, PLAN_ORDER, type PlanId } from "@/lib/plans";
import {
  calculateAmounts,
  calculateProratedUpgrade,
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
 * Self-service plan change (upgrade or downgrade).
 *
 * Upgrade : facture proforma proratisée → paiement par virement → activation immédiate.
 * Downgrade : planifié pour le prochain mois de facturation (pas de remboursement).
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

    const currentPlan = merchant.plan as PlanId;
    const currentIdx = PLAN_ORDER.indexOf(currentPlan);
    const newIdx = PLAN_ORDER.indexOf(newPlan);

    // Same plan
    if (newPlan === currentPlan && merchant.billingStatus === "active") {
      return NextResponse.json(
        { error: "Vous êtes déjà sur ce plan." },
        { status: 400 }
      );
    }

    // ── Downgrade → schedule for next month ──
    if (newIdx < currentIdx && currentPlan !== "trial") {
      return handleDowngrade(merchantId, currentPlan, newPlan, merchant.pendingPlanDowngrade);
    }

    // ── Upgrade → prorated invoice ──
    return handleUpgrade(merchantId, currentPlan, newPlan);
  } catch (err) {
    console.error("[Billing] Plan change error:", err);
    return NextResponse.json(
      { error: "Erreur lors du changement de plan." },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Downgrade — effectif au prochain mois de facturation
// ═══════════════════════════════════════════════════════════

async function handleDowngrade(
  merchantId: number,
  currentPlan: PlanId,
  newPlan: PlanId,
  existingPending: string | null,
): Promise<NextResponse> {
  // Already a pending downgrade to this plan
  if (existingPending === newPlan) {
    return NextResponse.json(
      {
        error: `Rétrogradation vers ${getPlanConfig(newPlan).name} déjà planifiée pour le prochain mois.`,
        code: "DOWNGRADE_ALREADY_SCHEDULED",
      },
      { status: 409 }
    );
  }

  // Schedule the downgrade
  await db
    .update(merchants)
    .set({ pendingPlanDowngrade: newPlan })
    .where(eq(merchants.id, merchantId));

  // Audit log (Art. 23)
  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "schedule_downgrade",
    targetType: "merchant",
    targetId: String(merchantId),
    details: JSON.stringify({
      fromPlan: currentPlan,
      toPlan: newPlan,
      effectiveAt: "next_billing_cycle",
    }),
  });

  const newConfig = getPlanConfig(newPlan);
  return NextResponse.json({
    data: {
      type: "downgrade_scheduled",
      plan: newPlan,
      planName: newConfig.name,
      message: `Votre plan sera rétrogradé vers ${newConfig.name} (${newConfig.label}) au prochain mois de facturation. Vous conservez votre plan actuel jusqu'à la fin du mois en cours.`,
    },
  });
}

// ═══════════════════════════════════════════════════════════
// Upgrade — facture proforma proratisée immédiate
// ═══════════════════════════════════════════════════════════

async function handleUpgrade(
  merchantId: number,
  currentPlan: PlanId,
  newPlan: PlanId,
): Promise<NextResponse> {
  // Check for existing pending invoice (prevent duplicates)
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

  // Calculate prorated upgrade amount (TTC — TVA incluse)
  const now = new Date();
  const currentConfig = getPlanConfig(currentPlan);
  const newConfig = getPlanConfig(newPlan);
  const currentPriceTTC = currentConfig.price * 100;
  const newPriceTTC = newConfig.price * 100;

  const { proratedTTC, daysRemaining, daysInMonth } =
    calculateProratedUpgrade(currentPriceTTC, newPriceTTC, now);

  // Minimum 1 DH to avoid zero-amount invoices
  const finalTTC = Math.max(proratedTTC, 100);
  const amounts = calculateAmounts(finalTTC);

  // Generate invoice number
  const [countResult] = await db.select({ cnt: count() }).from(invoices);
  const sequence = Number(countResult.cnt) + 1;
  const invoiceNumber = generateInvoiceNumber(sequence);

  // Due date
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

  // Clear any pending downgrade (upgrading cancels a scheduled downgrade)
  await db
    .update(merchants)
    .set({ pendingPlanDowngrade: null })
    .where(eq(merchants.id, merchantId));

  // Audit log (Art. 23)
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
      prorated: true,
      daysRemaining,
      daysInMonth,
      fullNewPriceTTC: newPriceTTC,
      fullCurrentPriceTTC: currentPriceTTC,
    }),
  });

  return NextResponse.json({
    data: {
      type: "upgrade",
      invoiceId: newInvoice.id,
      invoiceNumber,
      plan: newPlan,
      planName: newConfig.name,
      amountHT: amounts.amountHT,
      amountTVA: amounts.amountTVA,
      amountTTC: amounts.amountTTC,
      dueDate: dueDate.toISOString(),
      bankInfo: BANK_INFO,
      proration: {
        fromPlan: currentPlan,
        toPlan: newPlan,
        daysRemaining,
        daysInMonth,
        fullMonthTTC: newPriceTTC,
      },
    },
  });
}
