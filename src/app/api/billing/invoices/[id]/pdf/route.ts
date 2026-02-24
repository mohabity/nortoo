import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { invoices, merchants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requirePermission, handlePermissionError } from "@/lib/permissions";
import { generateInvoicePDF } from "@/lib/invoice-generator";
import { getPlanConfig } from "@/lib/plans";
import { CURRENCY } from "@/lib/billing-config";

/**
 * GET /api/billing/invoices/[id]/pdf
 * Generate and return invoice PDF for download.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await requirePermission("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId } = ctx;

  const { id } = await params;
  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  // Fetch invoice + merchant in parallel
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.merchantId, merchantId)))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const [merchant] = await db
    .select({
      name: merchants.name,
      email: merchants.email,
      billingName: merchants.billingName,
      billingAddress: merchants.billingAddress,
      billingICE: merchants.billingICE,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  const planConfig = getPlanConfig(invoice.planAtInvoice);

  const pdfBuffer = await generateInvoicePDF({
    invoiceNumber: invoice.invoiceNumber,
    period: invoice.period,
    createdAt: new Date(invoice.createdAt),
    dueDate: new Date(invoice.dueDate),
    merchant: {
      name: merchant.name,
      billingName: merchant.billingName,
      billingAddress: merchant.billingAddress,
      billingICE: merchant.billingICE,
      email: merchant.email,
    },
    plan: { name: planConfig.name, label: planConfig.label },
    amountHT: invoice.amountHT,
    tvaRate: invoice.tvaRate,
    amountTVA: invoice.amountTVA,
    amountTTC: invoice.amountTTC,
    currency: CURRENCY,
    status: invoice.status,
    paidAt: invoice.paidAt ? new Date(invoice.paidAt) : null,
  });

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
