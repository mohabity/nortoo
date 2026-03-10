import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { orders, customers } from "@/db/schema";
import { and, eq, gte, lte, lt, gt, like, or, desc, asc, count, sql } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { expandSearch } from "@/lib/search";
import { encodeCursor, decodeCursor } from "@/lib/cursor";

/**
 * Zod schema for query params validation.
 * Supports both page-based and cursor-based pagination.
 */
const ordersQuerySchema = z.object({
  // Page-based (legacy, still supported)
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  // Cursor-based (new)
  cursor: z.string().optional(),
  direction: z.enum(["next", "prev"]).default("next"),
  // Filters
  decision: z.enum(["all", "ship", "verify", "flag", "block"]).default("all"),
  pipeline: z.enum(["all", "needs_review", "escalated", "auto_blocked", "merchant_override", "auto_shipped", "pending"]).default("all"),
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

    // ── Single order detail mode: GET /api/orders?id=123 ──
    const singleId = params.get("id");
    if (singleId) {
      const orderId = parseInt(singleId, 10);
      if (isNaN(orderId)) {
        return NextResponse.json({ error: "ID invalide" }, { status: 400 });
      }

      const [order] = await db
        .select({
          id: orders.id,
          merchantId: orders.merchantId,
          customerId: orders.customerId,
          externalId: orders.externalId,
          externalRef: orders.externalRef,
          customerName: orders.customerName,
          customerPhoneLast4: orders.customerPhoneLast4,
          productName: orders.productName,
          productId: orders.productId,
          productCategory: orders.productCategory,
          productPrice: orders.productPrice,
          quantity: orders.quantity,
          total: orders.total,
          currency: orders.currency,
          shippingCity: orders.shippingCity,
          shippingAddress: orders.shippingAddress,
          parsedCity: orders.parsedCity,
          parsedZone: orders.parsedZone,
          parsedPostalCode: orders.parsedPostalCode,
          addressConfidence: orders.addressConfidence,
          fraudScore: orders.fraudScore,
          riskLevel: orders.riskLevel,
          decision: orders.decision,
          scoringFactors: orders.scoringFactors,
          scoreExplanation: orders.scoreExplanation,
          scoringVersion: orders.scoringVersion,
          overrideDecision: orders.overrideDecision,
          overrideBy: orders.overrideBy,
          overrideReason: orders.overrideReason,
          overrideAt: orders.overrideAt,
          deliveryStatus: orders.deliveryStatus,
          deliveredAt: orders.deliveredAt,
          pipelineStatus: orders.pipelineStatus,
          pipelineProcessedAt: orders.pipelineProcessedAt,
          reviewDeadline: orders.reviewDeadline,
          escalatedAt: orders.escalatedAt,
          escalationPriority: orders.escalationPriority,
          merchantNotifiedAt: orders.merchantNotifiedAt,
          whatsappVerificationStatus: orders.whatsappVerificationStatus,
          whatsappMessageId: orders.whatsappMessageId,
          isTest: orders.isTest,
          createdAt: orders.createdAt,
          scoredAt: orders.scoredAt,
        })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)));

      if (!order) {
        return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      }

      // Parse scoring factors
      let scoringFactors: { rule: string; points: number; reason: string }[] = [];
      if (order.scoringFactors) {
        try { scoringFactors = JSON.parse(order.scoringFactors); } catch { /* */ }
      }

      // Parse score explanation
      let scoreExplanation = null;
      if (order.scoreExplanation) {
        try { scoreExplanation = JSON.parse(order.scoreExplanation); } catch { /* */ }
      }

      // Fetch customer if linked
      let customer = null;
      if (order.customerId) {
        const [cust] = await db
          .select({
            id: customers.id,
            name: customers.name,
            city: customers.city,
            phoneLast4: customers.phoneLast4,
            totalOrders: customers.totalOrders,
            successfulOrders: customers.successfulOrders,
            failedOrders: customers.failedOrders,
            firstSeen: customers.firstSeen,
          })
          .from(customers)
          .where(and(eq(customers.id, order.customerId), eq(customers.merchantId, merchantId)));
        customer = cust ?? null;
      }

      // Compute confidence
      let confidence = 0.5;
      if (customer) {
        if (customer.totalOrders >= 3) confidence = 0.9;
        else if (customer.totalOrders >= 1) confidence = 0.7;
      }

      return NextResponse.json({
        data: { ...order, scoringFactors, scoreExplanation, confidence, customer },
      });
    }

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
      cursor,
      direction,
      decision,
      pipeline,
      city,
      status,
      score_min: scoreMin,
      score_max: scoreMax,
      search,
    } = parsed.data;

    const useCursor = !!cursor;

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

    // ── Cursor conditions (added on top of fullConditions) ──
    const cursorConditions = [...fullConditions];
    if (useCursor) {
      const cursorData = decodeCursor(cursor);
      if (!cursorData) {
        return NextResponse.json(
          { error: "Invalid cursor" },
          { status: 400 }
        );
      }

      const cursorTs = new Date(cursorData.ts);

      if (direction === "next") {
        cursorConditions.push(
          or(
            lt(orders.createdAt, cursorTs),
            and(eq(orders.createdAt, cursorTs), lt(orders.id, cursorData.id))
          )!
        );
      } else {
        cursorConditions.push(
          or(
            gt(orders.createdAt, cursorTs),
            and(eq(orders.createdAt, cursorTs), gt(orders.id, cursorData.id))
          )!
        );
      }
    }

    const cursorWhere = useCursor ? and(...cursorConditions) : where;

    // ── Select columns (shared) ──
    const selectCols = {
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
    };

    // ── Build data query ──
    let dataQuery;

    if (useCursor) {
      // Cursor mode: fetch perPage + 1 to detect hasMore
      if (direction === "prev") {
        dataQuery = db
          .select(selectCols)
          .from(orders)
          .where(cursorWhere)
          .orderBy(asc(orders.createdAt), asc(orders.id))
          .limit(perPage + 1);
      } else {
        dataQuery = db
          .select(selectCols)
          .from(orders)
          .where(cursorWhere)
          .orderBy(desc(orders.createdAt), desc(orders.id))
          .limit(perPage + 1);
      }
    } else {
      // Page-based (legacy)
      dataQuery = db
        .select(selectCols)
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage);
    }

    // ── Run queries in parallel ──
    const [totalResult, countsResult, rawData] = await Promise.all([
      // 1. Count for pagination (always uses filter conditions, never cursor)
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
      dataQuery,
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

    // ── Process results ──
    if (useCursor) {
      let data = [...rawData];
      const hasMore = data.length > perPage;
      if (hasMore) {
        data = data.slice(0, perPage); // trim the extra row
      }

      // Reverse results for "prev" direction (since we sorted ASC)
      if (direction === "prev") {
        data.reverse();
      }

      // Build cursors from first/last items
      const firstItem = data[0];
      const lastItem = data[data.length - 1];

      const nextCursor = hasMore && lastItem
        ? encodeCursor(lastItem.createdAt, lastItem.id)
        : undefined;

      // prevCursor: if we got data and there was a cursor, there might be previous pages
      const prevCursor = firstItem && cursor
        ? encodeCursor(firstItem.createdAt, firstItem.id)
        : undefined;

      return NextResponse.json({
        data,
        meta: {
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
          page: 0, // not meaningful in cursor mode
          hasMore,
          nextCursor,
          prevCursor,
          counts,
        },
      });
    }

    // ── Page-based response (legacy) ──
    return NextResponse.json({
      data: rawData,
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
