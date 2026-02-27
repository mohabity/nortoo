import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { invoices, merchants } from "@/db/schema";
import { and, eq, desc, count, sql, ne, isNotNull } from "drizzle-orm";
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
import type { Locale } from "@/i18n/types";

/**
 * GET /api/nrt-panel/invoices?status=pending|paid|overdue&merchantId=X
 * List all invoices (admin).
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const merchantIdFilter = url.searchParams.get("merchantId");
  const typeFilter = url.searchParams.get("type"); // "upgrade" → only upgrade invoices

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
  // Filter upgrade invoices: planAtInvoice differs from merchant's current plan
  if (typeFilter === "upgrade") {
    conditions.push(isNotNull(invoices.planAtInvoice));
    conditions.push(ne(invoices.planAtInvoice, merchants.plan));
  }

  const rows = await db
    .select({
      id: invoices.id,
      merchantId: invoices.merchantId,
      merchantName: merchants.name,
      merchantEmail: merchants.email,
      merchantPlan: merchants.plan,
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

  // Count pending upgrade requests (pending invoices where planAtInvoice != current plan)
  const [upgradeStats] = await db
    .select({
      countPendingUpgrades: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'pending' AND ${invoices.planAtInvoice} IS NOT NULL AND ${invoices.planAtInvoice} != ${merchants.plan} THEN 1 ELSE 0 END), 0)`,
      totalPendingUpgradeAmount: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'pending' AND ${invoices.planAtInvoice} IS NOT NULL AND ${invoices.planAtInvoice} != ${merchants.plan} THEN ${invoices.amountTTC} ELSE 0 END), 0)`,
    })
    .from(invoices)
    .innerJoin(merchants, eq(invoices.merchantId, merchants.id));

  return NextResponse.json({
    data: rows,
    stats: {
      totalPending: Number(stats.totalPending),
      totalPaid: Number(stats.totalPaid),
      countOverdue: Number(stats.countOverdue),
      totalCount: Number(stats.totalCount),
      countPendingUpgrades: Number(upgradeStats.countPendingUpgrades),
      totalPendingUpgradeAmount: Number(upgradeStats.totalPendingUpgradeAmount),
    },
  });
}

/**
 * POST /api/nrt-panel/invoices
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
      locale: merchants.locale,
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

  // Calculate amounts (prix TTC — TVA incluse)
  const planConfig = getPlanConfig(merchant.plan);
  const priceTTC = inputAmount ?? planConfig.price * 100; // DH TTC to centimes
  const amounts = calculateAmounts(priceTTC);

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
  const locale = (merchant.locale ?? "fr") as Locale;
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const [year, month] = period.split("-");
  const periodDate = new Date(parseInt(year), parseInt(month) - 1);
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

  return NextResponse.json({
    data: { id: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber, status: "created" },
  });
}
