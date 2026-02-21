import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, merchants } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { rtoCost, savingsProbability } from "@/lib/savings";
import { PLANS } from "@/lib/constants";

/**
 * GET /api/dashboard/savings?period=7d|30d|90d|all
 * Returns estimated savings from blocked/flagged orders.
 */
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId();
    const params = request.nextUrl.searchParams;

    // Parse period
    const periodParam = params.get("period") || "30d";
    const periodDays =
      periodParam === "7d" ? 7 :
      periodParam === "90d" ? 90 :
      periodParam === "all" ? 365 :
      30;

    const now = new Date();
    const since = new Date();
    since.setDate(since.getDate() - periodDays);
    const prevSince = new Date();
    prevSince.setDate(prevSince.getDate() - periodDays * 2);

    // Fetch merchant settings
    const [merchant] = await db
      .select({
        rtoCostFixed: merchants.rtoCostFixed,
        rtoCostPercent: merchants.rtoCostPercent,
        plan: merchants.plan,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Marchand introuvable" },
        { status: 404 }
      );
    }

    const { rtoCostFixed, rtoCostPercent, plan } = merchant;

    // Qualifying conditions: orders that were blocked, flagged, or escalated
    const qualifyingConditions = or(
      eq(orders.pipelineStatus, "auto_blocked"),
      eq(orders.pipelineStatus, "escalated"),
      and(eq(orders.decision, "block"), eq(orders.pipelineStatus, "merchant_override")),
      eq(orders.decision, "flag")
    )!;

    // Fetch current period + previous period in parallel
    const [currentOrders, prevOrders] = await Promise.all([
      db
        .select({
          total: orders.total,
          decision: orders.decision,
          pipelineStatus: orders.pipelineStatus,
          shippingCity: orders.shippingCity,
          productName: orders.productName,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false),
            gte(orders.createdAt, since),
            qualifyingConditions
          )
        ),
      db
        .select({
          total: orders.total,
          decision: orders.decision,
          pipelineStatus: orders.pipelineStatus,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false),
            gte(orders.createdAt, prevSince),
            lte(orders.createdAt, since),
            qualifyingConditions
          )
        ),
    ]);

    // ── Calculate current period savings ──
    let totalSaved = 0;
    let ordersSaved = 0;
    const breakdownAuto = { count: 0, amount: 0 };
    const breakdownMerchant = { count: 0, amount: 0 };
    const breakdownFlagged = { count: 0, amount: 0 };
    const productMap = new Map<string, { saved: number; count: number }>();
    const cityMap = new Map<string, { saved: number; count: number }>();

    for (const o of currentOrders) {
      const prob = savingsProbability(o.pipelineStatus, o.decision);
      if (prob === 0) continue;

      const saved = rtoCost(o.total, rtoCostFixed, rtoCostPercent) * prob;
      totalSaved += saved;
      ordersSaved++;

      // Breakdown
      if (o.pipelineStatus === "auto_blocked") {
        breakdownAuto.count++;
        breakdownAuto.amount += saved;
      } else if (o.decision === "block" && o.pipelineStatus === "merchant_override") {
        breakdownMerchant.count++;
        breakdownMerchant.amount += saved;
      } else {
        breakdownFlagged.count++;
        breakdownFlagged.amount += saved;
      }

      // Product aggregation
      const pName = o.productName || "Inconnu";
      const existing = productMap.get(pName) || { saved: 0, count: 0 };
      existing.saved += saved;
      existing.count++;
      productMap.set(pName, existing);

      // City aggregation
      const cName = o.shippingCity || "Inconnue";
      const existingCity = cityMap.get(cName) || { saved: 0, count: 0 };
      existingCity.saved += saved;
      existingCity.count++;
      cityMap.set(cName, existingCity);
    }

    // ── Previous period savings (for delta) ──
    let prevTotalSaved = 0;
    for (const o of prevOrders) {
      const prob = savingsProbability(o.pipelineStatus, o.decision);
      if (prob === 0) continue;
      prevTotalSaved += rtoCost(o.total, rtoCostFixed, rtoCostPercent) * prob;
    }

    // ── Derived metrics ──
    totalSaved = Math.round(totalSaved);
    prevTotalSaved = Math.round(prevTotalSaved);

    const avgSavedPerOrder = ordersSaved > 0 ? Math.round(totalSaved / ordersSaved) : 0;
    const dailyAvg = periodDays > 0 ? totalSaved / periodDays : 0;
    const projectedMonthlySaved = Math.round(dailyAvg * 30);
    const projectedYearlySaved = Math.round(dailyAvg * 365);

    const deltaPercent =
      prevTotalSaved > 0
        ? Math.round(((totalSaved - prevTotalSaved) / prevTotalSaved) * 100)
        : totalSaved > 0
        ? 100
        : 0;

    // ROI calculation
    const planKey = plan as keyof typeof PLANS;
    const planPrice = PLANS[planKey]?.price ?? 0;
    const roiMultiple =
      planPrice > 0
        ? Math.round((projectedMonthlySaved / planPrice) * 10) / 10
        : null;

    // Top 5 products and cities
    const topProducts = [...productMap.entries()]
      .map(([name, data]) => ({ name, saved: Math.round(data.saved), count: data.count }))
      .sort((a, b) => b.saved - a.saved)
      .slice(0, 5);

    const topCities = [...cityMap.entries()]
      .map(([name, data]) => ({ name, saved: Math.round(data.saved), count: data.count }))
      .sort((a, b) => b.saved - a.saved)
      .slice(0, 5);

    return NextResponse.json({
      data: {
        totalSaved,
        ordersSaved,
        avgSavedPerOrder,
        projectedMonthlySaved,
        projectedYearlySaved,
        roiMultiple,
        deltaPercent,
        breakdown: {
          autoBlocked: { count: breakdownAuto.count, amount: Math.round(breakdownAuto.amount) },
          merchantBlocked: { count: breakdownMerchant.count, amount: Math.round(breakdownMerchant.amount) },
          flaggedNotShipped: { count: breakdownFlagged.count, amount: Math.round(breakdownFlagged.amount) },
        },
        topProducts,
        topCities,
        period: {
          days: periodDays,
          from: since.toISOString(),
          to: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[Dashboard Savings] Error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
