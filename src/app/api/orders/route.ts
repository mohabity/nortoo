import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { and, eq, gte, lte, like, or, desc, count } from "drizzle-orm";
import { DEMO_MERCHANT_ID } from "@/lib/merchant";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(params.get("per_page") ?? "20", 10)));
  const decision = params.get("decision");
  const city = params.get("city");
  const status = params.get("status");
  const scoreMin = params.get("score_min");
  const scoreMax = params.get("score_max");
  const search = params.get("search");

  // ── Base conditions (without decision filter) — for pill counts ──
  const baseConditions: ReturnType<typeof eq>[] = [eq(orders.merchantId, DEMO_MERCHANT_ID)];

  if (city && city !== "all") {
    baseConditions.push(eq(orders.shippingCity, city));
  }
  if (status && status !== "all") {
    baseConditions.push(eq(orders.deliveryStatus, status));
  }
  if (scoreMin) {
    baseConditions.push(gte(orders.fraudScore, parseInt(scoreMin, 10)));
  }
  if (scoreMax) {
    baseConditions.push(lte(orders.fraudScore, parseInt(scoreMax, 10)));
  }
  if (search) {
    const pattern = `%${search}%`;
    baseConditions.push(
      or(
        like(orders.externalRef, pattern),
        like(orders.customerName, pattern),
        like(orders.shippingCity, pattern)
      )!
    );
  }

  const baseWhere = and(...baseConditions);

  // ── Full conditions (with decision filter) — for filtered results ──
  const fullConditions = [...baseConditions];
  if (decision && decision !== "all") {
    fullConditions.push(eq(orders.decision, decision));
  }
  const where = and(...fullConditions);

  // ── Run 3 queries in parallel ──
  const [totalResult, countsResult, data] = await Promise.all([
    // 1. Count for pagination (with decision filter)
    db.select({ count: count() }).from(orders).where(where),

    // 2. Grouped counts by decision (without decision filter — for pills)
    db
      .select({
        decision: orders.decision,
        count: count(),
      })
      .from(orders)
      .where(baseWhere)
      .groupBy(orders.decision),

    // 3. Paginated data
    db
      .select({
        id: orders.id,
        externalRef: orders.externalRef,
        customerName: orders.customerName,
        customerPhoneLast4: orders.customerPhoneLast4,
        productName: orders.productName,
        total: orders.total,
        shippingCity: orders.shippingCity,
        fraudScore: orders.fraudScore,
        decision: orders.decision,
        overrideDecision: orders.overrideDecision,
        deliveryStatus: orders.deliveryStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
  ]);

  const total = totalResult[0]?.count ?? 0;

  // Build counts object
  const counts = { all: 0, ship: 0, verify: 0, flag: 0, block: 0 };
  for (const row of countsResult) {
    const key = row.decision as keyof typeof counts;
    if (key in counts && key !== "all") {
      counts[key] = row.count;
    }
    counts.all += row.count;
  }

  return NextResponse.json({
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      counts,
    },
  });
}
