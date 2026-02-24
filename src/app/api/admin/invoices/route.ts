import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { invoices, merchants } from "@/db/schema";
import { and, eq, desc, count, sql } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";
import {
  calculateAmounts,
  generateInvoiceNumber,
  PAYMENT_TERMS_DAYS,
  formatAmountDH,
  BANK_INFO,
} from "@/lib/billing-config";
import { getPlanConfig } from "@/lib/plans";
import { sendEmail, buildInvoiceEmail } from "@/lib/email";

/**
 * GET /api/admin/invoices?status=pending|paid|overdue&merchantId=X
 * List all invoices (admin).
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const merchantIdFilter = url.searchParams.get("merchantId");

  const conditions = [];
  if (statusFilter && ["pending", "paid", "overdue", "cancelled"].includes(statusFilter)) {
    conditions.push(eq(invoices.status, statusFilter));
  }
  if (merchantIdFilter) {
    const mId = parseInt(merchantIdFilter, 10);
    if (!isNaN(mId)) {
      conditions.push(eq(invoices.merchantId, mId));
    }
  }

  const rows = await db
    .select({
      id: invoices.id,
      merchantId: invoices.merchantId,
      merchantName: merchants.name,
      merchantEmail: merchants.email,
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
    .innerJoin(merchants, eq(invoices.merchantId, merchants.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(invoices.createdAt))
    .limit(500);

  // Aggregate stats
  const [stats] = await db
    .select({
      totalPending: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'pending' THEN ${invoices.amountTTC} ELSE 0 END), 0)`,
      totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amountTTC} ELSE 0 END), 0)`,
      countOverdue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'overdue' THEN 1 ELSE 0 END), 0)`,
      totalCount: count(),
    })
    .from(invoices);

  return NextResponse.json({
    data: rows,
    stats: {
      totalPending: Number(stats.totalPending),
      totalPaid: Number(stats.totalPaid),
      countOverdue: Number(stats.countOverdue),
      totalCount: Number(stats.totalCount),
    },
  });
}

/**
 * POST /api/admin/invoices
 * Create invoice manually for a merchant.
 * Body: { merchantId, period?, amountHT? }
 */
export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const createSchema = z.object({
    merchantId: z.number(),
    period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    amountHT: z.number().optional(),
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { merchantId, period: inputPeriod, amountHT: inputAmount } = parsed.data;

  // Get merchant
  const [merchant] = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      email: merchants.email,
      plan: merchants.plan,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!merchant) {
    return NextResponse.json({ error: "Marchand introuvable" }, { status: 404 });
  }

  // Determine period (default: current month)
  const now = new Date();
  const period = inputPeriod ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Check no duplicate
  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.merchantId, merchantId), eq(invoices.period, period)))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: `Facture déjà existante pour ${period}` },
      { status: 409 }
    );
  }

  // Calculate amounts
  const planConfig = getPlanConfig(merchant.plan);
  const priceHT = inputAmount ?? planConfig.price * 100; // convert DH to centimes
  const amounts = calculateAmounts(priceHT);

  // Generate invoice number
  const [countResult] = await db
    .select({ cnt: count() })
    .from(invoices);
  const sequence = Number(countResult.cnt) + 1;
  const invoiceNumber = generateInvoiceNumber(sequence);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + PAYMENT_TERMS_DAYS);

  // Insert
  const [newInvoice] = await db
    .insert(invoices)
    .values({
      merchantId,
      invoiceNumber,
      period,
      planAtInvoice: merchant.plan,
      amountHT: amounts.amountHT,
      tvaRate: 20,
      amountTVA: amounts.amountTVA,
      amountTTC: amounts.amountTTC,
      status: "pending",
      dueDate,
    })
    .returning({ id: invoices.id, invoiceNumber: invoices.invoiceNumber });

  // Send invoice email
  const monthNames = [
    "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const [year, month] = period.split("-");
  const periodLabel = `${monthNames[parseInt(month, 10)]} ${year}`;

  const emailData = buildInvoiceEmail({
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

  return NextResponse.json({
    data: { id: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber, status: "created" },
  });
}
