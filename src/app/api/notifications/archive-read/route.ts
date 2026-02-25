import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { notifications } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * PUT /api/notifications/archive-read
 * Archives all read, non-archived notifications for the current merchant.
 */
export async function PUT() {
  const merchantId = await getMerchantId();

  await db
    .update(notifications)
    .set({ archivedAt: new Date() })
    .where(
      and(
        eq(notifications.merchantId, merchantId),
        eq(notifications.read, true),
        isNull(notifications.archivedAt)
      )
    );

  return NextResponse.json({ data: { success: true } });
}
