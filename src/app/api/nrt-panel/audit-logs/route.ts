import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { auditLogs, merchants, users } from "@/db/schema";
import { count, eq, desc, sql, gte, lte, ilike } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(30),
  actor: z.enum(["system", "merchant", "consumer", "admin"]).optional(),
  action: z.string().optional(),
  search: z.string().optional(),
  merchant_id: z.coerce.number().int().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
});

/**
 * GET /api/nrt-panel/audit-logs
 * Paginated audit log viewer for admin panel.
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
    if (params.actor) {
      conditions.push(eq(auditLogs.actor, params.actor));
    }
    if (params.action) {
      conditions.push(eq(auditLogs.action, params.action));
    }
    if (params.search) {
      conditions.push(ilike(auditLogs.details, `%${params.search}%`));
    }
    if (params.merchant_id) {
      conditions.push(eq(auditLogs.merchantId, params.merchant_id));
    }
    if (params.after) {
      conditions.push(gte(auditLogs.createdAt, new Date(params.after)));
    }
    if (params.before) {
      conditions.push(lte(auditLogs.createdAt, new Date(params.before)));
    }

    const whereClause =
      conditions.length > 0
        ? sql`${sql.join(conditions, sql` AND `)}`
        : undefined;

    // Count total
    const [totalResult] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(whereClause);

    const total = totalResult?.total ?? 0;
    const totalPages = Math.ceil(total / params.per_page);
    const offset = (params.page - 1) * params.per_page;

    // Fetch logs with merchant name join
    const data = await db
      .select({
        id: auditLogs.id,
        merchantId: auditLogs.merchantId,
        merchantName: merchants.name,
        userId: auditLogs.userId,
        userName: users.name,
        actor: auditLogs.actor,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        details: auditLogs.details,
        ipHash: auditLogs.ipHash,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(merchants, eq(auditLogs.merchantId, merchants.id))
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
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
    console.error("[Admin Audit Logs] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
