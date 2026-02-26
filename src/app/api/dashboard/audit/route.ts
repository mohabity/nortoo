import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { auditLogs } from "@/db/schema";
import { and, eq, gte, lte, desc, count, type SQL } from "drizzle-orm";
import {
  requirePermission,
  handlePermissionError,
} from "@/lib/permissions";

/**
 * GET /api/dashboard/audit
 * Returns paginated audit logs for the current merchant.
 * Requires compliance:read permission (admin-only).
 */

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  actor: z
    .enum(["all", "system", "merchant", "consumer", "admin"])
    .default("all"),
  action: z.string().max(50).optional(),
  date_from: z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Format de date invalide" }).optional(),
  date_to: z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Format de date invalide" }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { merchantId } = await requirePermission("compliance:read");
    const params = request.nextUrl.searchParams;

    const raw = Object.fromEntries(params.entries());
    const parsed = auditQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres de requête invalides" },
        { status: 400 }
      );
    }

    const { page, per_page: perPage, actor, action, date_from, date_to } =
      parsed.data;

    // Build conditions
    const conditions: SQL[] = [eq(auditLogs.merchantId, merchantId)];

    if (actor !== "all") {
      conditions.push(eq(auditLogs.actor, actor));
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    if (date_from) {
      conditions.push(gte(auditLogs.createdAt, new Date(date_from)));
    }
    if (date_to) {
      conditions.push(lte(auditLogs.createdAt, new Date(date_to)));
    }

    const where = and(...conditions);

    // Parallel: fetch rows + count
    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db.select({ count: count() }).from(auditLogs).where(where),
    ]);

    const total = totalRow?.count ?? 0;

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        actor: r.actor,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        details: r.details ? JSON.parse(r.details) : null,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (err) {
    try {
      return handlePermissionError(err);
    } catch {
      console.error("[audit:GET]", err);
      return NextResponse.json(
        { error: "Erreur serveur interne" },
        { status: 500 }
      );
    }
  }
}
