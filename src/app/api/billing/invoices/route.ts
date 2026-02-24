import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requirePermission, handlePermissionError } from "@/lib/permissions";

/**
 * GET /api/billing/invoices
 * List invoices for the authenticated merchant.
 */
export async function GET() {
  let ctx;
  try {
    ctx = await requirePermission("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId } = ctx;

  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      period: invoices.period,
      planAtInvoice: invoices.planAtInvoice,
      amountHT: invoices.amountHT,
      tvaRate: invoices.tvaRate,
      amountTVA: invoices.amountTVA,
      amountTTC: invoices.amountTTC,
      status: invoices.status,
      paidAt: invoices.paidAt,
      paidNote: invoices.paidNote,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(eq(invoices.merchantId, merchantId))
    .orderBy(desc(invoices.createdAt))
    .limit(100);

  return NextResponse.json({ data: rows });
}
