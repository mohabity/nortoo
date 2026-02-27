import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { invoices, merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";
import { generateInvoicePDF } from "@/lib/invoice-generator";
import { getPlanConfig } from "@/lib/plans";
import { CURRENCY } from "@/lib/billing-config";

const updateSchema = z.object({
  status: z.enum(["pending", "paid", "overdue", "cancelled"]),
  paidNote: z.string().max(200).optional(),
});

/**
 * PUT /api/nrt-panel/invoices/[id]
 * Update invoice status (mark paid, overdue, cancelled).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  // Fetch invoice
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const { status, paidNote } = parsed.data;

  // Update invoice
  const updateData: Record<string, unknown> = { status };
  if (status === "paid") {
    updateData.paidAt = new Date();
    if (paidNote) updateData.paidNote = paidNote;
  }

  await db
    .update(invoices)
    .set(updateData)
    .where(eq(invoices.id, invoiceId));

  // If marking as paid, activate the merchant on the invoiced plan
  if (status === "paid") {
    await db
      .update(merchants)
      .set({
        plan: invoice.planAtInvoice,    // upgrade to the invoiced plan
        billingStatus: "active",
        trialEndsAt: null,              // no longer on trial
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, invoice.merchantId));
  }

  // If marking as overdue, set merchant to past_due
  if (status === "overdue") {
    await db
      .update(merchants)
      .set({ billingStatus: "past_due", updatedAt: new Date() })
      .where(eq(merchants.id, invoice.merchantId));
  }

  return NextResponse.json({ data: { status: "updated" } });
}

/**
 * GET /api/nrt-panel/invoices/[id]
 * Download invoice PDF (admin).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
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
    .where(eq(merchants.id, invoice.merchantId))
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
