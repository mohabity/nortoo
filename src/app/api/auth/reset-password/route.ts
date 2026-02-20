import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db/index";
import { merchants, passwordResetTokens, auditLogs } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  passwordConfirm: z.string().min(1),
});

/**
 * POST /api/auth/reset-password
 * Body: { token, password, passwordConfirm }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Données invalides";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { token, password, passwordConfirm } = parsed.data;

  if (password !== passwordConfirm) {
    return NextResponse.json(
      { error: "Les mots de passe ne correspondent pas" },
      { status: 400 }
    );
  }

  // Hash the incoming token to compare with DB
  const hashedToken = createHash("sha256").update(token).digest("hex");

  // Find unused token
  const [resetRecord] = await db
    .select({
      id: passwordResetTokens.id,
      merchantId: passwordResetTokens.merchantId,
      expiresAt: passwordResetTokens.expiresAt,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, hashedToken),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);

  if (!resetRecord) {
    return NextResponse.json(
      { error: "Lien invalide ou déjà utilisé" },
      { status: 400 }
    );
  }

  // Check expiration
  if (resetRecord.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Ce lien a expiré. Demandez un nouveau lien." },
      { status: 400 }
    );
  }

  // Hash the new password
  const passwordHash = await hash(password, 12);

  // Update merchant password
  await db
    .update(merchants)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(merchants.id, resetRecord.merchantId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetRecord.id));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId: resetRecord.merchantId,
    actor: "merchant",
    action: "password_reset_completed",
    targetType: "merchant",
    targetId: String(resetRecord.merchantId),
    details: JSON.stringify({ merchantId: resetRecord.merchantId }),
  });

  return NextResponse.json({ success: true });
}
