import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { phoneList, auditLogs } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requirePermission, requireActiveMerchant, handlePermissionError } from "@/lib/permissions";
import { hashPhone, maskPhone } from "@/lib/hash";

const addSchema = z.object({
  phone: z.string().min(8).max(20),
  listType: z.enum(["whitelist", "blacklist"]),
  reason: z.string().max(200).optional(),
});

/**
 * GET /api/phone-list?type=whitelist|blacklist
 * List phone list entries for the merchant.
 */
export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requirePermission("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId } = ctx;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  const conditions = [eq(phoneList.merchantId, merchantId)];
  if (type === "whitelist" || type === "blacklist") {
    conditions.push(eq(phoneList.listType, type));
  }

  const rows = await db
    .select({
      id: phoneList.id,
      phoneMasked: phoneList.phoneMasked,
      listType: phoneList.listType,
      reason: phoneList.reason,
      addedBy: phoneList.addedBy,
      createdAt: phoneList.createdAt,
    })
    .from(phoneList)
    .where(and(...conditions))
    .orderBy(desc(phoneList.createdAt))
    .limit(500);

  return NextResponse.json({ data: rows });
}

/**
 * POST /api/phone-list
 * Add a phone number to whitelist or blacklist.
 * If already listed, updates the list type (switch).
 */
export async function POST(request: Request) {
  let ctx;
  try {
    ctx = await requireActiveMerchant("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId, userId } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { phone, listType, reason } = parsed.data;
  const hashed = hashPhone(phone);
  const masked = maskPhone(phone);

  // Check if already listed for this merchant
  const [existing] = await db
    .select({ id: phoneList.id, listType: phoneList.listType })
    .from(phoneList)
    .where(
      and(eq(phoneList.merchantId, merchantId), eq(phoneList.phoneHash, hashed))
    )
    .limit(1);

  if (existing) {
    // Update: switch list type or update reason
    await db
      .update(phoneList)
      .set({ listType, reason: reason ?? null, addedBy: "merchant" })
      .where(eq(phoneList.id, existing.id));
  } else {
    // Insert new entry
    await db.insert(phoneList).values({
      merchantId,
      phoneHash: hashed,
      phoneMasked: masked,
      listType,
      reason: reason ?? null,
      addedBy: "merchant",
    });
  }

  // Audit log
  await db.insert(auditLogs).values({
    merchantId,
    userId,
    actor: "merchant",
    action: "phonelist_add",
    targetType: "phonelist",
    targetId: hashed.slice(0, 12),
    details: JSON.stringify({
      listType,
      reason: reason ?? null,
      updated: !!existing,
      previousType: existing?.listType ?? null,
    }),
  });

  return NextResponse.json({
    data: { status: existing ? "updated" : "added", listType, phone: masked },
  });
}

/**
 * DELETE /api/phone-list?id=<number>
 * Remove a phone number from the list.
 */
export async function DELETE(request: Request) {
  let ctx;
  try {
    ctx = await requireActiveMerchant("orders:write");
  } catch (err) {
    return handlePermissionError(err);
  }
  const { merchantId, userId } = ctx;

  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  if (!idParam) {
    return NextResponse.json({ error: "Paramètre id manquant" }, { status: 400 });
  }

  const entryId = parseInt(idParam, 10);
  if (isNaN(entryId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  // Verify ownership before deleting
  const [entry] = await db
    .select({ id: phoneList.id, phoneHash: phoneList.phoneHash, listType: phoneList.listType })
    .from(phoneList)
    .where(
      and(eq(phoneList.id, entryId), eq(phoneList.merchantId, merchantId))
    )
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  }

  await db.delete(phoneList).where(and(eq(phoneList.id, entryId), eq(phoneList.merchantId, merchantId)));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId,
    userId,
    actor: "merchant",
    action: "phonelist_remove",
    targetType: "phonelist",
    targetId: entry.phoneHash.slice(0, 12),
    details: JSON.stringify({ listType: entry.listType }),
  });

  return NextResponse.json({ data: { status: "removed" } });
}
