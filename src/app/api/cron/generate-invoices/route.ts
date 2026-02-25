import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, invoices } from "@/db/schema";
import { and, eq, ne, count } from "drizzle-orm";
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

const MONTH_NAMES = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/**
 * GET /api/cron/generate-invoices
 * Runs on the 2nd of every month (0 0 2 * *).
 * Generates invoices for all paying merchants.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("generate-invoices", async () => {
      const now = new Date();
      // Invoice period = current month (e.g. on Feb 2nd → "2026-02")
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Get all paying merchants (plan != "trial", billingStatus != "cancelled")
      const payingMerchants = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email,
          plan: merchants.plan,
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

        const priceHT = planConfig.price * 100; // DH to centimes
        const amounts = calculateAmounts(priceHT);

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
        const periodLabel = `${MONTH_NAMES[now.getMonth() + 1]} ${now.getFullYear()}`;
        const emailData = await buildInvoiceEmail({
          merchantName: merchant.name,
          invoiceNumber,
          period: periodLabel,
          amountTTC: formatAmountDH(amounts.amountTTC),
          dueDate: dueDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          rib: BANK_INFO.rib,
          iban: BANK_INFO.iban,
          swift: BANK_INFO.swift,
        });

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
        `[generate-invoices] Period ${period}: ${generated} generated, ${skipped} skipped`
      );

      return { period, generated, skipped };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[generate-invoices] Error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
