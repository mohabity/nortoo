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
 * POST /api/auth/2fa/verify
 * Verifies the TOTP code and activates 2FA for the user.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

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

  const { code } = parsed.data;
  const userId = Number(session.user.userId);

  // Get user's pending secret
  const [user] = await db
    .select({
      twoFactorSecret: users.twoFactorSecret,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.twoFactorSecret) {
    return NextResponse.json(
      { error: "Lancez la configuration 2FA d'abord" },
      { status: 400 }
    );
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Le 2FA est déjà activé" },
      { status: 400 }
    );
  }

  // Verify the code
  const valid = verifyTOTPCode(user.twoFactorSecret, code);
  if (!valid) {
    return NextResponse.json(
      { error: "Code TOTP incorrect. Réessayez." },
      { status: 400 }
    );
  }

  // Enable 2FA
  await db
    .update(users)
    .set({
      twoFactorEnabled: true,
      twoFactorVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId: session.user.merchantId,
    userId,
    actor: "merchant",
    action: "2fa_enabled",
    targetType: "user",
    targetId: String(userId),
  });

  return NextResponse.json({ data: { success: true } });
}
