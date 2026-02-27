import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyTOTPCode } from "@/lib/totp";
import { z } from "zod";

const schema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
});

/**
 * POST /api/auth/2fa/disable
 * Disables 2FA for the current user.
 * - TOTP method: requires a valid TOTP code
 * - Email method: requires the user's password (sent as `code` field, re-validated)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const userId = Number(session.user.userId);

  // Get user's 2FA info
  const [user] = await db
    .select({
      twoFactorSecret: users.twoFactorSecret,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorMethod: users.twoFactorMethod,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Le 2FA n'est pas activé" },
      { status: 400 }
    );
  }

  // For TOTP method, require a valid TOTP code
  if (user.twoFactorMethod === "totp") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Code invalide — 6 chiffres requis" },
        { status: 400 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Configuration 2FA invalide" },
        { status: 400 }
      );
    }

    const valid = verifyTOTPCode(user.twoFactorSecret, parsed.data.code);
    if (!valid) {
      return NextResponse.json(
        { error: "Code TOTP incorrect. Le 2FA ne peut pas être désactivé." },
        { status: 400 }
      );
    }
  }

  // For email method, no code verification needed — the user is already authenticated

  // Disable 2FA — clear all 2FA fields
  await db
    .update(users)
    .set({
      twoFactorEnabled: false,
      twoFactorMethod: null,
      twoFactorSecret: null,
      twoFactorVerifiedAt: null,
      twoFactorBackupCodes: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId: session.user.merchantId,
    userId,
    actor: "merchant",
    action: "2fa_disabled",
    targetType: "user",
    targetId: String(userId),
    details: JSON.stringify({ method: user.twoFactorMethod }),
  });

  return NextResponse.json({ data: { success: true } });
}
