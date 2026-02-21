import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { users, auditLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  requirePermission,
  handlePermissionError,
} from "@/lib/permissions";

/**
 * PUT /api/team/[id]
 * Update user role or status. Requires team:manage.
 */
const updateSchema = z.object({
  role: z.enum(["admin", "manager", "operator"]).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("team:manage");
    const { id } = await params;
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { role: newRole, status: newStatus } = parsed.data;
    if (!newRole && !newStatus) {
      return NextResponse.json(
        { error: "Aucune modification spécifiée" },
        { status: 400 }
      );
    }

    // Find target user
    const [targetUser] = await db
      .select({
        id: users.id,
        merchantId: users.merchantId,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(
        and(eq(users.id, targetId), eq(users.merchantId, ctx.merchantId))
      )
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Guard: cannot change own role
    if (newRole && targetUser.id === ctx.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      );
    }

    // Guard: cannot demote last admin
    if (newRole && newRole !== "admin" && targetUser.role === "admin") {
      const [{ count: adminCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(
          and(
            eq(users.merchantId, ctx.merchantId),
            eq(users.role, "admin"),
            eq(users.status, "active")
          )
        );

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Impossible : il doit rester au moins un administrateur actif",
          },
          { status: 400 }
        );
      }
    }

    // Guard: cannot disable last admin
    if (newStatus === "disabled" && targetUser.role === "admin") {
      const [{ count: adminCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(
          and(
            eq(users.merchantId, ctx.merchantId),
            eq(users.role, "admin"),
            eq(users.status, "active")
          )
        );

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Impossible : il doit rester au moins un administrateur actif",
          },
          { status: 400 }
        );
      }
    }

    // Apply updates
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (newRole) updates.role = newRole;
    if (newStatus) updates.status = newStatus;

    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, targetId));

    // Audit log
    await db.insert(auditLogs).values({
      merchantId: ctx.merchantId,
      userId: ctx.userId,
      actor: "merchant",
      action: "team_update",
      targetType: "user",
      targetId: String(targetId),
      details: JSON.stringify({
        changes: { role: newRole, status: newStatus },
        previous: { role: targetUser.role, status: targetUser.status },
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handlePermissionError(err);
  }
}

/**
 * DELETE /api/team/[id]
 * Remove a user. Requires team:manage.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("team:manage");
    const { id } = await params;
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Find target user
    const [targetUser] = await db
      .select({
        id: users.id,
        merchantId: users.merchantId,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        and(eq(users.id, targetId), eq(users.merchantId, ctx.merchantId))
      )
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Guard: cannot remove self
    if (targetUser.id === ctx.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous supprimer vous-même" },
        { status: 400 }
      );
    }

    // Guard: cannot remove last admin
    if (targetUser.role === "admin") {
      const [{ count: adminCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(
          and(
            eq(users.merchantId, ctx.merchantId),
            eq(users.role, "admin"),
            eq(users.status, "active")
          )
        );

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Impossible : il doit rester au moins un administrateur actif",
          },
          { status: 400 }
        );
      }
    }

    // Delete user
    await db.delete(users).where(eq(users.id, targetId));

    // Audit log
    await db.insert(auditLogs).values({
      merchantId: ctx.merchantId,
      userId: ctx.userId,
      actor: "merchant",
      action: "team_remove",
      targetType: "user",
      targetId: String(targetId),
      details: JSON.stringify({ email: targetUser.email, role: targetUser.role }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handlePermissionError(err);
  }
}
