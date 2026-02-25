import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { notifications } from "@/db/schema";
import { and, eq, desc, count, isNull, isNotNull } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

export async function GET(request: NextRequest) {
  const merchantId = await getMerchantId();
  const params = request.nextUrl.searchParams;

  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const perPage = Math.min(50, Math.max(1, parseInt(params.get("per_page") ?? "20", 10)));
  const showArchived = params.get("archived") === "true";

  // Archive filter: by default exclude archived
  const archiveCondition = showArchived
    ? isNotNull(notifications.archivedAt)
    : isNull(notifications.archivedAt);

  // Run list + unread count + total count in parallel
  const [data, unreadResult, totalResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.merchantId, merchantId),
          archiveCondition
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),

    db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.merchantId, merchantId),
          eq(notifications.read, false),
          isNull(notifications.archivedAt)
        )
      ),

    db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.merchantId, merchantId),
          archiveCondition
        )
      ),
  ]);

  return NextResponse.json({
    data,
    meta: {
      page,
      perPage,
      total: totalResult[0]?.count ?? 0,
      totalPages: Math.ceil((totalResult[0]?.count ?? 0) / perPage),
      unreadCount: unreadResult[0]?.count ?? 0,
    },
  });
}
