import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const merchantId = await getMerchantId();
  const { id } = await params;
  const notificationId = parseInt(id, 10);
  if (isNaN(notificationId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.merchantId, merchantId)
      )
    );

  return NextResponse.json({ data: { id: notificationId, read: true } });
}
