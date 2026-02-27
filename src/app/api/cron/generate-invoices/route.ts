import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, invoices, auditLogs } from "@/db/schema";
import { and, eq, ne, isNotNull, count } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { getPlanConfig } from "@/lib/plans";
import {
  calculateAmounts,
  generateInvoiceNumber,
  PAYMENT_TERMS_DAYS,
  formatAmountDH,
  BANK_INFO,
} from "@/lib/billing-config";
import { sendEmail, buildInvoiceEmail } from "@/lib/email";
import { withCronMonitoring } from "@/lib/cron-monitor";
import type { Locale } from "@/i18n/types";

/**
 * GET /api/cron/generate-invoices
 * Runs on the 2nd of every month (0 0 2 * *).
 * 1. Apply pending plan downgrades
 * 2. Generate invoices for all paying merchants
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("generate-invoices", async () => {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // ── Step 1: Apply pending downgrades ──
      const downgraded = await applyPendingDowngrades();

      // ── Step 2: Generate invoices ──
      const payingMerchants = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email,
          plan: merchants.plan,
          locale: merchants.locale,
        })
        .from(merchants)
        .where(
          and(
            ne(merchants.plan, "trial"),
            ne(merchants.billingStatus, "cancelled")
          )
        );

      let generated = 0;
      let skipped = 0;

      for (const merchant of payingMerchants) {
        // Check if invoice already exists for this period
        const [existing] = await db
          .select({ id: invoices.id })
          .from(invoices)
          .where(
            and(
              eq(invoices.merchantId, merchant.id),
              eq(invoices.period, period)
            )
          )
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        const planConfig = getPlanConfig(merchant.plan);
        if (planConfig.price === 0) {
          skipped++;
          continue;
        }

        const priceTTC = planConfig.price * 100; // DH TTC to centimes
        const amounts = calculateAmounts(priceTTC);

        // Generate sequential invoice number
        const [countResult] = await db
          .select({ cnt: count() })
          .from(invoices);
        const sequence = Number(countResult.cnt) + 1;
        const invoiceNumber = generateInvoiceNumber(sequence);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + PAYMENT_TERMS_DAYS);

        // Insert invoice
        await db.insert(invoices).values({
          merchantId: merchant.id,
          invoiceNumber,
          period,
          planAtInvoice: merchant.plan,
          amountHT: amounts.amountHT,
          tvaRate: 20,
          amountTVA: amounts.amountTVA,
          amountTTC: amounts.amountTTC,
          status: "pending",
          dueDate,
        });

        // Send email
        const locale = (merchant.locale ?? "fr") as Locale;
        const dateLocale = locale === "en" ? "en-US" : "fr-FR";
        const periodDate = new Date(now.getFullYear(), now.getMonth());
        let periodLabel = periodDate.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
        periodLabel = periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);
        const emailData = await buildInvoiceEmail({
          merchantName: merchant.name,
          invoiceNumber,
          period: periodLabel,
          amountTTC: formatAmountDH(amounts.amountTTC),
          dueDate: dueDate.toLocaleDateString(dateLocale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          rib: BANK_INFO.rib,
          iban: BANK_INFO.iban,
          swift: BANK_INFO.swift,
        }, locale);

        await sendEmail({
          to: merchant.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        generated++;
        console.log(`[generate-invoices] ${invoiceNumber} → ${merchant.name} (${merchant.plan})`);
      }

      console.log(
        `[generate-invoices] Period ${period}: ${generated} generated, ${skipped} skipped, ${downgraded} downgraded`
      );

      return { period, generated, skipped, downgraded };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[generate-invoices] Error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

/**
 * Apply all pending plan downgrades.
 * Called at the start of each billing cycle (before generating invoices).
 * Sets merchant.plan = pendingPlanDowngrade, then clears the field.
 */
async function applyPendingDowngrades(): Promise<number> {
  const pendingMerchants = await db
    .select({
      id: merchants.id,
      plan: merchants.plan,
      pendingPlanDowngrade: merchants.pendingPlanDowngrade,
    })
    .from(merchants)
    .where(isNotNull(merchants.pendingPlanDowngrade));

  let applied = 0;

  for (const merchant of pendingMerchants) {
    const newPlan = merchant.pendingPlanDowngrade!;
    const oldPlan = merchant.plan;

    await db
      .update(merchants)
      .set({
        plan: newPlan,
        pendingPlanDowngrade: null,
      })
      .where(eq(merchants.id, merchant.id));

    await db.insert(auditLogs).values({
      merchantId: merchant.id,
      actor: "system",
      action: "apply_downgrade",
      targetType: "merchant",
      targetId: String(merchant.id),
      details: JSON.stringify({
        fromPlan: oldPlan,
        toPlan: newPlan,
      }),
    });

    applied++;
    console.log(`[generate-invoices] Downgrade applied: merchant #${merchant.id} ${oldPlan} → ${newPlan}`);
  }

  return applied;
}
