import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { dataRightsRequests } from "@/db/schema";
import { and, eq, desc, count, type SQL } from "drizzle-orm";
import {
  requirePermission,
  handlePermissionError,
} from "@/lib/permissions";

/**
 * GET /api/data-rights/list
 * Returns paginated data rights requests for the current merchant.
 * Requires compliance:read permission (admin-only).
 */

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  right_type: z
    .enum(["all", "access", "rectification", "deletion", "opposition"])
    .default("all"),
  status: z
    .enum(["all", "pending", "processing", "completed", "refused"])
    .default("all"),
});

export async function GET(request: NextRequest) {
  try {
    const { merchantId } = await requirePermission("compliance:read");
    const params = request.nextUrl.searchParams;

    const raw = Object.fromEntries(params.entries());
    const parsed = listQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { page, per_page: perPage, right_type, status } = parsed.data;

    const conditions: SQL[] = [eq(dataRightsRequests.merchantId, merchantId)];

    if (right_type !== "all") {
      conditions.push(eq(dataRightsRequests.rightType, right_type));
    }
    if (status !== "all") {
      conditions.push(eq(dataRightsRequests.status, status));
    }

    const where = and(...conditions);

    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(dataRightsRequests)
        .where(where)
        .orderBy(desc(dataRightsRequests.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db.select({ count: count() }).from(dataRightsRequests).where(where),
    ]);

    const total = totalRow?.count ?? 0;

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        requesterPhoneHash: r.requesterPhoneHash.slice(0, 8) + "...",
        rightType: r.rightType,
        status: r.status,
        responseDeadline: r.responseDeadline?.toISOString() ?? null,
        completedAt: r.completedAt?.toISOString() ?? null,
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
      console.error("[data-rights:list]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
