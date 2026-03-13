import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { supportTickets, merchants, users } from "@/db/schema";
import { eq, and, desc, count, ilike, or } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  category: z.enum(["scoring", "orders", "integration", "billing", "other"]).optional(),
  search: z.string().optional(),
});

/**
 * GET /api/nrt-panel/tickets
 * Admin: list all support tickets across all merchants.
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(url.searchParams));

    const conditions = [];
    if (params.status) conditions.push(eq(supportTickets.status, params.status));
    if (params.priority) conditions.push(eq(supportTickets.priority, params.priority));
    if (params.category) conditions.push(eq(supportTickets.category, params.category));
    if (params.search) {
      const term = `%${params.search}%`;
      conditions.push(
        or(
          ilike(supportTickets.subject, term),
          ilike(supportTickets.description, term)
        )!
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(supportTickets)
      .where(where);

    const total = totalResult?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / params.per_page));

    const data = await db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        description: supportTickets.description,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        resolvedAt: supportTickets.resolvedAt,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        merchantId: supportTickets.merchantId,
        merchantName: merchants.name,
        merchantEmail: merchants.email,
      })
      .from(supportTickets)
      .leftJoin(merchants, eq(supportTickets.merchantId, merchants.id))
      .where(where)
      .orderBy(desc(supportTickets.createdAt))
      .limit(params.per_page)
      .offset((params.page - 1) * params.per_page);

    return NextResponse.json({
      data,
      meta: { page: params.page, totalPages, total },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
