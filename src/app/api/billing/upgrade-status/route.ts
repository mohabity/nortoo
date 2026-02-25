import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, invoices } from "@/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { getPlanConfig, type PlanId } from "@/lib/plans";
import { BANK_INFO } from "@/lib/billing-config";

/**
 * GET /api/billing/upgrade-status
 *
 * Checks if the merchant has a pending upgrade invoice.
 * Returns the pending invoice details + bank info if found.
 */
export async function GET() {
  try {
    const merchantId = await getMerchantId();

    // Get current merchant plan
    const [merchant] = await db
      .select({ plan: merchants.plan })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Marchand introuvable" },
        { status: 404 }
      );
    }

    // Find the most recent pending invoice for a different plan (= upgrade request)
    const [pendingInvoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        planAtInvoice: invoices.planAtInvoice,
        amountHT: invoices.amountHT,
        amountTVA: invoices.amountTVA,
        amountTTC: invoices.amountTTC,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.merchantId, merchantId),
          eq(invoices.status, "pending"),
          ne(invoices.planAtInvoice, merchant.plan)
        )
      )
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    if (!pendingInvoice) {
      return NextResponse.json({ data: { pending: false } });
    }

    const planConfig = getPlanConfig(pendingInvoice.planAtInvoice as PlanId);

    return NextResponse.json({
      data: {
        pending: true,
        invoice: {
          id: pendingInvoice.id,
          invoiceNumber: pendingInvoice.invoiceNumber,
          plan: pendingInvoice.planAtInvoice,
          planName: planConfig.name,
          amountHT: pendingInvoice.amountHT,
          amountTVA: pendingInvoice.amountTVA,
          amountTTC: pendingInvoice.amountTTC,
          dueDate: pendingInvoice.dueDate
            ? new Date(pendingInvoice.dueDate).toISOString()
            : null,
          createdAt: new Date(pendingInvoice.createdAt).toISOString(),
        },
        bankInfo: BANK_INFO,
      },
    });
  } catch (err) {
    console.error("[Billing] Upgrade status error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du statut." },
      { status: 500 }
    );
  }
}
