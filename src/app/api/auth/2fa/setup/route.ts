import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateTOTPSecret, generateBackupCodes } from "@/lib/totp";

/**
 * POST /api/auth/2fa/setup
 * Generates a TOTP secret and QR code for 2FA setup.
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

  // Generate secret + QR + backup codes
  const email = session.user.email ?? "";
  const { secret, qrDataUrl } = await generateTOTPSecret(email);
  const backupCodes = generateBackupCodes();

  // Store secret temporarily (not enabled yet — user must verify first)
  await db
    .update(users)
    .set({
      twoFactorSecret: secret,
      twoFactorBackupCodes: JSON.stringify(backupCodes.hashed),
      updatedAt: new Date(),
    })
    .where(eq(users.id, Number(userId)));

  return NextResponse.json({
    data: {
      qrDataUrl,
      backupCodes: backupCodes.raw,
    },
  });
}
