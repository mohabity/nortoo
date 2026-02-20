import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

export async function PUT() {
  const merchantId = await getMerchantId();

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.merchantId, merchantId),
        eq(notifications.read, false)
      )
    );

  return NextResponse.json({ data: { success: true } });
}
