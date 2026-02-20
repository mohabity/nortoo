import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { inviteLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";

/**
 * DELETE /api/admin/invites/[id] — Soft-delete (deactivate) an invite.
 * Admin-only (merchantId === 1).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const merchantId = await getMerchantId();
  if (!merchantId || merchantId !== 1) {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const { id } = await params;
  const inviteId = parseInt(id, 10);
  if (isNaN(inviteId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  await db
    .update(inviteLinks)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(inviteLinks.id, inviteId));

  return NextResponse.json({ ok: true });
}
