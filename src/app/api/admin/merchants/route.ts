import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { count, eq, desc, asc, sql } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  plan: z.enum(["trial", "starter", "pro", "scale"]).optional(),
  status: z.enum(["trial", "active", "past_due", "cancelled"]).optional(),
  sort: z
    .enum(["created_desc", "created_asc", "orders_desc", "name_asc", "name_desc"])
    .default("created_desc"),
});

/**
 * GET /api/admin/merchants
 * Paginated merchant list with filters.
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(url.searchParams));

    // Build conditions
    const conditions = [];
    if (params.plan) {
      conditions.push(eq(merchants.plan, params.plan));
    }
    if (params.status) {
      conditions.push(eq(merchants.billingStatus, params.status));
    }

    const whereClause =
      conditions.length > 0
        ? sql`${sql.join(conditions, sql` AND `)}`
        : undefined;

    // Sort
    const sortMap = {
      created_desc: desc(merchants.createdAt),
      created_asc: asc(merchants.createdAt),
      orders_desc: desc(merchants.currentMonthOrders),
      name_asc: asc(merchants.name),
      name_desc: desc(merchants.name),
    };
    const orderBy = sortMap[params.sort];

    // Count total
    const [totalResult] = await db
      .select({ total: count() })
      .from(merchants)
      .where(whereClause);

    const total = totalResult?.total ?? 0;
    const totalPages = Math.ceil(total / params.per_page);
    const offset = (params.page - 1) * params.per_page;

    // Fetch merchants
    const data = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        email: merchants.email,
        plan: merchants.plan,
        billingStatus: merchants.billingStatus,
        currentMonthOrders: merchants.currentMonthOrders,
        trialEndsAt: merchants.trialEndsAt,
        createdAt: merchants.createdAt,
      })
      .from(merchants)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(params.per_page)
      .offset(offset);

    return NextResponse.json({
      data,
      meta: {
        page: params.page,
        perPage: params.per_page,
        total,
        totalPages,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[Admin Merchants] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
