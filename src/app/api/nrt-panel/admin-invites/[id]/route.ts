import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/db/index";
import { adminUsers, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getAdminId } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/rate-limit";

/**
 * PATCH /api/nrt-panel/admin-invites/[id]
 * Activate or deactivate an admin.
 * Body: { isActive: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const callingAdminId = await getAdminId();
  const ip = getClientIp(request);
  const { id } = await params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  // Prevent self-deactivation
  if (callingAdminId && targetId === callingAdminId) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous désactiver vous-même." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { isActive } = body as { isActive?: boolean };
  if (typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "isActive (boolean) requis." },
      { status: 400 }
    );
  }

  // Check target exists
  const [target] = await db
    .select({ id: adminUsers.id, email: adminUsers.email })
    .from(adminUsers)
    .where(eq(adminUsers.id, targetId))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Admin introuvable." }, { status: 404 });
  }

  await db
    .update(adminUsers)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(adminUsers.id, targetId));

  // Audit log
  await db.insert(auditLogs).values({
    actor: "admin",
    action: isActive ? "admin_reactivated" : "admin_deactivated",
    targetType: "admin_user",
    targetId: String(targetId),
    details: JSON.stringify({
      email: target.email,
      by: callingAdminId,
    }),
    ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
  });

  console.info(
    `[Admin] ${isActive ? "Reactivated" : "Deactivated"} — targetId: ${targetId}, by: ${callingAdminId}, IP: ${ip}`
  );

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/nrt-panel/admin-invites/[id]
 * Cancel a pending admin invitation (delete the row).
 * Only works for pending admins (isActive = false, no password).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const callingAdminId = await getAdminId();
  const ip = getClientIp(request);
  const { id } = await params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  // Check target exists and is pending
  const [target] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      isActive: adminUsers.isActive,
      passwordHash: adminUsers.passwordHash,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, targetId))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Admin introuvable." }, { status: 404 });
  }

  // Only allow deleting pending invitations (no password, not active)
  if (target.isActive || target.passwordHash) {
    return NextResponse.json(
      { error: "Seules les invitations en attente peuvent être annulées." },
      { status: 400 }
    );
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, targetId));

  // Audit log
  await db.insert(auditLogs).values({
    actor: "admin",
    action: "admin_invite_cancelled",
    targetType: "admin_user",
    targetId: String(targetId),
    details: JSON.stringify({
      email: target.email,
      by: callingAdminId,
    }),
    ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
  });

  console.info(
    `[Admin] Invite cancelled — email: ${target.email}, by: ${callingAdminId}, IP: ${ip}`
  );

  return NextResponse.json({ ok: true });
}
