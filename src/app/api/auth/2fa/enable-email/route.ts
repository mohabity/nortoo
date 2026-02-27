import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/auth/2fa/enable-email
 * Enables email-based 2FA for the current user.
 * No setup flow needed — just toggle it on.
 * Only admin and manager roles can enable 2FA.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { userId, role } = session.user;
  if (role !== "admin" && role !== "manager") {
    return NextResponse.json(
      { error: "Seuls les admins et managers peuvent activer le 2FA" },
      { status: 403 }
    );
  }

  // Check if 2FA is already enabled
  const [user] = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, Number(userId)))
    .limit(1);

  if (user?.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Le 2FA est déjà activé" },
      { status: 400 }
    );
  }

  // Enable email 2FA — no secret/backup codes needed
  await db
    .update(users)
    .set({
      twoFactorEnabled: true,
      twoFactorMethod: "email",
      twoFactorVerifiedAt: new Date(),
      // Clear any TOTP data
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, Number(userId)));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId: session.user.merchantId,
    userId: Number(userId),
    actor: "merchant",
    action: "2fa_enabled",
    targetType: "user",
    targetId: String(userId),
    details: JSON.stringify({ method: "email" }),
  });

  return NextResponse.json({ data: { success: true } });
}
