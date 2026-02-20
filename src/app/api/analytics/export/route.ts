import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, cityStats, productStats, auditLogs } from "@/db/schema";
import { eq, and, gte, desc, avg, count, sql } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { requireVerifiedEmail } from "@/lib/email-verification";

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

/** RFC 4180 CSV field escaping */
function csvField(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/** Risk tier → French label */
function riskTierLabel(tier: string | null): string {
  switch (tier) {
    case "safe": return "Fiable";
    case "moderate": return "Mod\u00E9r\u00E9";
    case "risky": return "Risque";
    case "dangerous": return "Dangereux";
    default: return tier ?? "Inconnu";
  }
}

/**
 * GET /api/analytics/export
 * Exports a 3-section analytics CSV: KPIs, top cities, top products.
 * Query params: period = 7 | 30 | 90 (days, default 30)
 */
export async function GET(request: NextRequest) {
  const merchantId = await getMerchantId();

  // Email verification guard
  const verifyCheck = await requireVerifiedEmail(merchantId);
  if (!verifyCheck.allowed) {
    return NextResponse.json(
      { error: verifyCheck.error, code: verifyCheck.code },
      { status: 403 }
    );
  }

  const params = request.nextUrl.searchParams;

  // Rate limit
  if (!checkRateLimit(merchantId)) {
    return NextResponse.json(
      { error: "Limite d'export atteinte (10/heure). R\u00E9essayez plus tard." },
      { status: 429 }
    );
  }

  const periodDays = Math.min(parseInt(params.get("period") || "30", 10), 365);
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const now = new Date();

  // ── 3 parallel queries ──
  const [kpiResult, cities, products] = await Promise.all([
    // KPIs from orders
    db
      .select({
        totalOrders: count(),
        avgScore: avg(orders.fraudScore),
        delivered: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')`,
        returned: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'returned')`,
        blocked: sql<number>`count(*) filter (where ${orders.decision} = 'block')`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.isTest, false),
          gte(orders.createdAt, since)
        )
      ),

    // Top 20 cities by RTO
    db
      .select({
        cityDisplay: cityStats.cityDisplay,
        totalOrders: cityStats.totalOrders,
        deliveredOrders: cityStats.deliveredOrders,
        returnedOrders: cityStats.returnedOrders,
        rtoRate: cityStats.rtoRate,
        avgScore: cityStats.avgScore,
        riskTier: cityStats.riskTier,
      })
      .from(cityStats)
      .where(
        and(
          eq(cityStats.merchantId, merchantId),
          gte(cityStats.totalOrders, 5)
        )
      )
      .orderBy(desc(cityStats.rtoRate))
      .limit(20),

    // Top 20 products by RTO
    db
      .select({
        productName: productStats.productName,
        productCategory: productStats.productCategory,
        totalOrders: productStats.totalOrders,
        deliveredOrders: productStats.deliveredOrders,
        returnedOrders: productStats.returnedOrders,
        rtoRate: productStats.rtoRate,
        totalRevenue: productStats.totalRevenue,
      })
      .from(productStats)
      .where(
        and(
          eq(productStats.merchantId, merchantId),
          gte(productStats.totalOrders, 3)
        )
      )
      .orderBy(desc(productStats.rtoRate))
      .limit(20),
  ]);

  const kpi = kpiResult[0];
  const total = kpi?.totalOrders ?? 0;
  const avgScoreNum = kpi?.avgScore ? Math.round(Number(kpi.avgScore)) : 0;
  const delivered = Number(kpi?.delivered ?? 0);
  const returned = Number(kpi?.returned ?? 0);
  const blocked = Number(kpi?.blocked ?? 0);
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const rtoRate = total > 0 ? Math.round((returned / total) * 100) : 0;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatD = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // ── Build CSV ──
  const BOM = "\uFEFF";
  const CRLF = "\r\n";
  const lines: string[] = [];

  // Section 1: KPIs
  lines.push(`\u2550\u2550\u2550 R\u00C9SUM\u00C9 \u2014 ${periodDays} DERNIERS JOURS \u2550\u2550\u2550`);
  lines.push("M\u00E9trique,Valeur");
  lines.push(`P\u00E9riode,${csvField(`Du ${formatD(since)} au ${formatD(now)}`)}`);
  lines.push(`Total commandes,${total}`);
  lines.push(`Score moyen,${avgScoreNum}`);
  lines.push(`Taux livraison,${deliveryRate}%`);
  lines.push(`Taux RTO,${rtoRate}%`);
  lines.push(`Commandes livr\u00E9es,${delivered}`);
  lines.push(`Commandes retourn\u00E9es,${returned}`);
  lines.push(`Commandes bloqu\u00E9es,${blocked}`);
  lines.push("");

  // Section 2: Cities
  lines.push(`\u2550\u2550\u2550 TOP VILLES PAR TAUX RTO \u2550\u2550\u2550`);
  lines.push("Ville,Commandes,Livr\u00E9es,Retours,Taux RTO (%),Score moyen,Niveau risque");
  for (const c of cities) {
    lines.push([
      csvField(c.cityDisplay),
      csvField(c.totalOrders),
      csvField(c.deliveredOrders),
      csvField(c.returnedOrders),
      csvField(c.rtoRate != null ? Math.round(c.rtoRate * 100 * 10) / 10 : 0),
      csvField(c.avgScore != null ? Math.round(c.avgScore) : 0),
      csvField(riskTierLabel(c.riskTier)),
    ].join(","));
  }
  lines.push("");

  // Section 3: Products
  lines.push(`\u2550\u2550\u2550 TOP PRODUITS PAR TAUX RTO \u2550\u2550\u2550`);
  lines.push("Produit,Cat\u00E9gorie,Commandes,Livr\u00E9es,Retours,Taux RTO (%),CA Total (DH)");
  for (const p of products) {
    lines.push([
      csvField(p.productName),
      csvField(p.productCategory),
      csvField(p.totalOrders),
      csvField(p.deliveredOrders),
      csvField(p.returnedOrders),
      csvField(p.rtoRate != null ? Math.round(p.rtoRate * 100 * 10) / 10 : 0),
      csvField(p.totalRevenue != null ? Math.round(p.totalRevenue) : 0),
    ].join(","));
  }

  const csv = BOM + lines.join(CRLF) + CRLF;

  // Audit log
  await db.insert(auditLogs).values({
    merchantId,
    actor: "merchant",
    action: "analytics_exported",
    targetType: "analytics",
    details: JSON.stringify({
      periodDays,
      cities: cities.length,
      products: products.length,
    }),
  });

  const today = new Date().toISOString().slice(0, 10);

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="analytique-${today}.csv"`);

  return new Response(csv, { status: 200, headers });
}
