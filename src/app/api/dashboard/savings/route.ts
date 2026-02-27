import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, merchants } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { rtoCost, savingsProbability } from "@/lib/savings";
import { getPlanConfig } from "@/lib/plans";

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

    // Fetch qualifying + all orders for current & previous periods
    const [currentOrders, prevOrders, allCurrentOrders, allPrevOrders] = await Promise.all([
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
      // All orders current period (for RTO/delivery WoW)
      db
        .select({
          deliveryStatus: orders.deliveryStatus,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false),
            gte(orders.createdAt, since)
          )
        ),
      // All orders previous period (for RTO/delivery WoW)
      db
        .select({
          deliveryStatus: orders.deliveryStatus,
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, merchantId),
            eq(orders.isTest, false),
            gte(orders.createdAt, prevSince),
            lte(orders.createdAt, since)
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
    const planPrice = getPlanConfig(plan).price;
    const roiMultiple =
      planPrice > 0
        ? Math.round((projectedMonthlySaved / planPrice) * 10) / 10
        : null;

    // Previous period ROI
    const prevDailyAvg = periodDays > 0 ? prevTotalSaved / periodDays : 0;
    const prevProjectedMonthly = Math.round(prevDailyAvg * 30);
    const prevRoiMultiple =
      planPrice > 0
        ? Math.round((prevProjectedMonthly / planPrice) * 10) / 10
        : null;
    const roiDelta =
      roiMultiple !== null && prevRoiMultiple !== null
        ? Math.round((roiMultiple - prevRoiMultiple) * 10) / 10
        : null;

    // ── RTO & Delivery WoW deltas ──
    const curTotal = allCurrentOrders.length;
    const curReturned = allCurrentOrders.filter(
      (o) => o.deliveryStatus === "returned"
    ).length;
    const curDelivered = allCurrentOrders.filter(
      (o) => o.deliveryStatus === "delivered"
    ).length;

    const prevTotal = allPrevOrders.length;
    const prevReturned = allPrevOrders.filter(
      (o) => o.deliveryStatus === "returned"
    ).length;
    const prevDelivered = allPrevOrders.filter(
      (o) => o.deliveryStatus === "delivered"
    ).length;

    const curRtoRate = curTotal > 0 ? Math.round((curReturned / curTotal) * 1000) / 10 : 0;
    const prevRtoRate = prevTotal > 0 ? Math.round((prevReturned / prevTotal) * 1000) / 10 : 0;
    const rtoRateDelta = Math.round((curRtoRate - prevRtoRate) * 10) / 10;

    const curDeliveryRate = curTotal > 0 ? Math.round((curDelivered / curTotal) * 1000) / 10 : 0;
    const prevDeliveryRate = prevTotal > 0 ? Math.round((prevDelivered / prevTotal) * 1000) / 10 : 0;
    const deliveryRateDelta = Math.round((curDeliveryRate - prevDeliveryRate) * 10) / 10;

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
        // WoW deltas for all KPIs
        rtoRate: curRtoRate,
        rtoRateDelta,
        deliveryRate: curDeliveryRate,
        deliveryRateDelta,
        deliveredCount: curDelivered,
        roiDelta,
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
