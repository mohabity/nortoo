import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { and, eq, gte, lte, like, or, desc, count } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { expandSearch } from "@/lib/search";

/**
 * Zod schema for query params validation.
 * Uses coerce for numeric params (query params are always strings).
 */
const ordersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  decision: z.enum(["all", "ship", "verify", "flag", "block"]).default("all"),
  pipeline: z.enum(["all", "needs_review", "escalated", "auto_blocked", "merchant_override", "auto_shipped"]).default("all"),
  city: z.string().max(100).default("all"),
  status: z.string().max(100).default("all"),
  score_min: z.coerce.number().int().min(0).max(100).optional(),
  score_max: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantId();
    const params = request.nextUrl.searchParams;

    // ── Validate query params with Zod ──
    const raw = Object.fromEntries(params.entries());
    const parsed = ordersQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      page,
      per_page: perPage,
      decision,
      pipeline,
      city,
      status,
      score_min: scoreMin,
      score_max: scoreMax,
      search,
    } = parsed.data;

    // ── Base conditions (without decision filter) — for pill counts ──
    const baseConditions: ReturnType<typeof eq>[] = [
      eq(orders.merchantId, merchantId),
      eq(orders.isTest, false),
    ];

    if (city && city !== "all") {
      baseConditions.push(eq(orders.shippingCity, city));
    }
    if (status && status !== "all") {
      baseConditions.push(eq(orders.deliveryStatus, status));
    }
    if (scoreMin !== undefined) {
      baseConditions.push(gte(orders.fraudScore, scoreMin));
    }
    if (scoreMax !== undefined) {
      baseConditions.push(lte(orders.fraudScore, scoreMax));
    }
    if (search) {
      const groups = expandSearch(search);
      for (const group of groups) {
        if (group.length === 1) {
          baseConditions.push(like(orders.searchIndex, `%${group[0]}%`));
        } else {
          // OR across aliases within a group
          baseConditions.push(
            or(...group.map((term) => like(orders.searchIndex, `%${term}%`)))!
          );
        }
      }
    }

    const baseWhere = and(...baseConditions);

    // ── Full conditions (with decision + pipeline filter) — for filtered results ──
    const fullConditions = [...baseConditions];
    if (decision && decision !== "all") {
      fullConditions.push(eq(orders.decision, decision));
    }
    if (pipeline && pipeline !== "all") {
      fullConditions.push(eq(orders.pipelineStatus, pipeline));
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
          pipelineStatus: orders.pipelineStatus,
          scoreExplanation: orders.scoreExplanation,
          reviewDeadline: orders.reviewDeadline,
          escalationPriority: orders.escalationPriority,
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
  } catch (error) {
    console.error("[Orders] Error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
