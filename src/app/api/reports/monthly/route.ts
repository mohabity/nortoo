import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import {
  orders,
  merchants,
  cityStats,
  productStats,
  auditLogs,
} from "@/db/schema";
import { and, eq, gte, lte, count, avg, sql, desc } from "drizzle-orm";
import { requirePermission, handlePermissionError } from "@/lib/permissions";
import { requireVerifiedEmail } from "@/lib/email-verification";
import { generateMonthlyReport, type ReportData } from "@/lib/report-generator";
import { PLANS } from "@/lib/constants";

// ── Rate limiting (in-memory) ──
const exportCounts = new Map<number, { count: number; resetAt: number }>();
const MAX_EXPORTS_PER_HOUR = 10;

function checkRateLimit(merchantId: number): boolean {
  const now = Date.now();
  const entry = exportCounts.get(merchantId);
  if (!entry || now > entry.resetAt) {
    exportCounts.set(merchantId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= MAX_EXPORTS_PER_HOUR) return false;
  entry.count++;
  return true;
}

// ── French month names ──
const MONTH_NAMES = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

/**
 * GET /api/reports/monthly?month=YYYY-MM
 * Generates and returns a PDF monthly report.
 */
export async function GET(request: NextRequest) {
  // Auth
  let ctx;
  try {
    ctx = await requirePermission("analytics:read");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId, userId } = ctx;

  // Email verification guard
  const verifyCheck = await requireVerifiedEmail(merchantId);
  if (!verifyCheck.allowed) {
    return NextResponse.json(
      { error: verifyCheck.error, code: verifyCheck.code },
      { status: 403 }
    );
  }

  // Rate limit
  if (!checkRateLimit(merchantId)) {
    return NextResponse.json(
      { error: "Limite d'export atteinte (10/heure). Reessayez plus tard." },
      { status: 429 }
    );
  }

  // Parse month param (default: previous month)
  const params = request.nextUrl.searchParams;
  let year: number;
  let month: number; // 1-12

  const monthParam = params.get("month");
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    year = prev.getFullYear();
    month = prev.getMonth() + 1;
  }

  // Validate range
  if (month < 1 || month > 12 || year < 2024 || year > 2030) {
    return NextResponse.json(
      { error: "Mois invalide. Format attendu : YYYY-MM" },
      { status: 400 }
    );
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Previous month for comparison
  const prevStartDate = new Date(year, month - 2, 1);
  const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);

  // ── Parallel queries ──
  const [
    kpiResult,
    prevKpiResult,
    decisionResult,
    weeklyResult,
    citiesData,
    productsData,
    merchantData,
  ] = await Promise.all([
    // Current month KPIs
    db
      .select({
        totalOrders: count(),
        avgScore: avg(orders.fraudScore),
        delivered: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')`,
        returned: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'returned')`,
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.isTest, false),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      ),

    // Previous month KPIs (for comparison)
    db
      .select({
        totalOrders: count(),
        delivered: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')`,
        returned: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'returned')`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.isTest, false),
          gte(orders.createdAt, prevStartDate),
          lte(orders.createdAt, prevEndDate)
        )
      ),

    // Decisions breakdown
    db
      .select({
        decision: orders.decision,
        cnt: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.isTest, false),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(orders.decision),

    // Weekly breakdown
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${orders.createdAt}), 'YYYY-MM-DD')`,
        decision: orders.decision,
        cnt: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.isTest, false),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(
        sql`date_trunc('week', ${orders.createdAt})`,
        orders.decision
      )
      .orderBy(sql`date_trunc('week', ${orders.createdAt})`),

    // Cities (pre-aggregated, top 10 by volume)
    db
      .select({
        cityDisplay: cityStats.cityDisplay,
        totalOrders: cityStats.totalOrders,
        rtoRate: cityStats.rtoRate,
        avgScore: cityStats.avgScore,
      })
      .from(cityStats)
      .where(
        and(
          eq(cityStats.merchantId, merchantId),
          gte(cityStats.totalOrders, 3)
        )
      )
      .orderBy(desc(cityStats.totalOrders))
      .limit(10),

    // Products (pre-aggregated, top 5 by lost revenue)
    db
      .select({
        productName: productStats.productName,
        totalOrders: productStats.totalOrders,
        returnedOrders: productStats.returnedOrders,
        rtoRate: productStats.rtoRate,
        avgOrderValue: productStats.avgOrderValue,
        totalRevenue: productStats.totalRevenue,
      })
      .from(productStats)
      .where(
        and(
          eq(productStats.merchantId, merchantId),
          gte(productStats.totalOrders, 3)
        )
      )
      .orderBy(desc(sql`${productStats.returnedOrders} * ${productStats.avgOrderValue}`))
      .limit(5),

    // Merchant settings
    db
      .select({
        name: merchants.name,
        plan: merchants.plan,
        rtoCostFixed: merchants.rtoCostFixed,
        rtoCostPercent: merchants.rtoCostPercent,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1),
  ]);

  const merchant = merchantData[0];
  if (!merchant) {
    return NextResponse.json(
      { error: "Marchand introuvable" },
      { status: 404 }
    );
  }

  // ── Process KPIs ──
  const kpi = kpiResult[0];
  const totalOrders = kpi?.totalOrders ?? 0;
  const delivered = Number(kpi?.delivered ?? 0);
  const returned = Number(kpi?.returned ?? 0);
  const avgScore = kpi?.avgScore ? Number(kpi.avgScore) : 0;
  const totalRevenue = Number(kpi?.totalRevenue ?? 0);
  const deliveryRate = totalOrders > 0 ? delivered / totalOrders : 0;

  // Previous month
  const prevKpi = prevKpiResult[0];
  const prevTotal = prevKpi?.totalOrders ?? 0;
  const prevDelivered = Number(prevKpi?.delivered ?? 0);
  const prevDeliveryRate = prevTotal > 0 ? prevDelivered / prevTotal : 0;

  // ── Decisions ──
  const decisions = { ship: 0, verify: 0, flag: 0, block: 0 };
  for (const row of decisionResult) {
    const d = row.decision as keyof typeof decisions;
    if (d in decisions) decisions[d] = row.cnt;
  }

  // ── Savings calculation ──
  const rtoCostFixed = merchant.rtoCostFixed ?? 65;
  const rtoCostPercent = merchant.rtoCostPercent ?? 0.05;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const blockedOrders = decisions.block;
  const costPerBlockedOrder = rtoCostFixed + avgOrderValue * rtoCostPercent;
  const savings = Math.round(blockedOrders * costPerBlockedOrder);

  // Previous month savings (approximate)
  const prevReturned = Number(prevKpi?.returned ?? 0);
  const prevSavings = Math.round(prevReturned > 0 ? prevReturned * costPerBlockedOrder * 0.8 : 0);

  // ROI
  const planKey = (merchant.plan ?? "trial") as keyof typeof PLANS;
  const planPrice = PLANS[planKey]?.price ?? 0;
  const roi = planPrice > 0 ? savings / planPrice : 0;

  // ── Weekly data ──
  const weekMap = new Map<string, { ship: number; verify: number; flag: number; block: number }>();
  for (const row of weeklyResult) {
    const weekKey = row.week;
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { ship: 0, verify: 0, flag: 0, block: 0 });
    }
    const w = weekMap.get(weekKey)!;
    const d = row.decision as keyof typeof decisions;
    if (d in w) w[d] = row.cnt;
  }

  const weeklyData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data], i) => ({
      label: `Sem. ${i + 1}`,
      ...data,
    }));

  // ── Cities ──
  const cities = citiesData.map((c) => ({
    name: c.cityDisplay,
    orders: c.totalOrders,
    rtoRate: c.rtoRate ?? 0,
    scoreDelta: c.avgScore ? Math.round(c.avgScore - avgScore) : 0,
    trend: (c.rtoRate ?? 0) > 0.3 ? "en hausse" : (c.rtoRate ?? 0) > 0.15 ? "stable" : "en baisse",
  }));

  // ── Products ──
  const products = productsData.map((p) => ({
    name: p.productName,
    orders: p.totalOrders,
    rtoRate: p.rtoRate ?? 0,
    lostRevenue: Math.round(
      (p.returnedOrders ?? 0) * (p.avgOrderValue ?? 0)
    ),
  }));

  // ── Build ReportData ──
  const monthLabel = MONTH_NAMES[month - 1];
  const periodLabel = `1 ${monthLabel} ${year} — ${endDate.getDate()} ${monthLabel} ${year}`;

  const reportData: ReportData = {
    merchant: { name: merchant.name, plan: merchant.plan ?? "trial" },
    period: { from: startDate, to: endDate, label: periodLabel },
    generatedAt: new Date(),
    kpis: {
      totalOrders,
      deliveryRate,
      savings,
      roi: Math.round(roi * 10) / 10,
    },
    comparison: {
      deliveryRateChange: deliveryRate - prevDeliveryRate,
      savingsChange: savings - prevSavings,
    },
    decisions,
    avgScore,
    cities,
    products,
    weeklyData,
    savings: { totalSaved: savings, ordersSaved: blockedOrders },
  };

  // ── Generate PDF ──
  const pdfBuffer = await generateMonthlyReport(reportData);

  // ── Audit log ──
  await db.insert(auditLogs).values({
    merchantId,
    userId,
    actor: "merchant",
    action: "report_exported",
    targetType: "analytics",
    targetId: `${year}-${String(month).padStart(2, "0")}`,
    details: JSON.stringify({
      month: `${year}-${String(month).padStart(2, "0")}`,
      totalOrders,
      format: "pdf",
    }),
  });

  // ── Return PDF ──
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `attachment; filename="siift-rapport-${monthStr}.pdf"`
  );

  return new Response(new Uint8Array(pdfBuffer), { status: 200, headers });
}
