import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { invoices, merchants } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { sendEmail, buildOverdueEmail } from "@/lib/email";
import { formatAmountDH, BANK_INFO } from "@/lib/billing-config";
import { withCronMonitoring } from "@/lib/cron-monitor";
import type { Locale } from "@/i18n/types";

/**
 * GET /api/cron/mark-overdue
 * Runs daily at 8 AM (0 8 * * *).
 * Marks pending invoices past due date as overdue.
 * Sets merchant billingStatus to "past_due".
 * Sends overdue reminder email.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("mark-overdue", async () => {
      const now = new Date();

      // Find pending invoices past due date
      const overdueInvoices = await db
        .select({
          id: invoices.id,
          merchantId: invoices.merchantId,
          invoiceNumber: invoices.invoiceNumber,
          amountTTC: invoices.amountTTC,
          dueDate: invoices.dueDate,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "pending"),
            lt(invoices.dueDate, now)
          )
        );

      let marked = 0;

      for (const inv of overdueInvoices) {
        // Mark as overdue
        await db
          .update(invoices)
          .set({ status: "overdue" })
          .where(eq(invoices.id, inv.id));

        // Set merchant billing status to past_due
        await db
          .update(merchants)
          .set({ billingStatus: "past_due", updatedAt: now })
          .where(eq(merchants.id, inv.merchantId));

        // Get merchant info for email
        const [merchant] = await db
          .select({ name: merchants.name, email: merchants.email, locale: merchants.locale })
          .from(merchants)
          .where(eq(merchants.id, inv.merchantId))
          .limit(1);

        if (merchant) {
          const locale = (merchant.locale ?? "fr") as Locale;
          const dateLocale = locale === "en" ? "en-US" : "fr-FR";
          const emailData = await buildOverdueEmail({
            merchantName: merchant.name,
            invoiceNumber: inv.invoiceNumber,
            amountTTC: formatAmountDH(inv.amountTTC),
            dueDate: new Date(inv.dueDate).toLocaleDateString(dateLocale, {
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
        }

        marked++;
        console.info(`[mark-overdue] ${inv.invoiceNumber} → overdue`);
      }

      console.info(`[mark-overdue] ${marked} invoices marked as overdue`);

      return { marked };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[mark-overdue] Error:", err);
    return NextResponse.json({ error: "Mark overdue failed" }, { status: 500 });
  }
}
