import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db/index";
import { users, merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

const validateTokenSchema = z.object({
  token: z.string().min(1),
});

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).max(100),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

/**
 * GET /api/team/accept-invite?token=XXX
 * Validates an invite token and returns user info for pre-filling the form.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const parsed = validateTokenSchema.safeParse({ token });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Token manquant" },
      { status: 400 }
    );
  }

  const hashedToken = createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  // Find user by invite token
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      inviteExpiresAt: users.inviteExpiresAt,
      merchantId: users.merchantId,
    })
    .from(users)
    .where(eq(users.inviteToken, hashedToken))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "Lien d'invitation invalide ou déjà utilisé" },
      { status: 400 }
    );
  }

  if (user.status !== "pending") {
    return NextResponse.json(
      { error: "Cette invitation a déjà été acceptée" },
      { status: 400 }
    );
  }

  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "Cette invitation a expiré. Demandez à votre administrateur de renvoyer l'invitation." },
      { status: 400 }
    );
  }

  // Get merchant name
  const [merchant] = await db
    .select({ name: merchants.name })
    .from(merchants)
    .where(eq(merchants.id, user.merchantId))
    .limit(1);

  return NextResponse.json({
    data: {
      email: user.email,
      name: user.name,
      role: user.role,
      merchantName: merchant?.name ?? "nortoo",
    },
  });
}

/**
 * POST /api/team/accept-invite
 * Accept an invitation by setting a password.
 * Body: { token, name, password }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { token, name, password } = parsed.data;
  const hashedToken = createHash("sha256").update(token).digest("hex");

  // Find user by invite token
  const [user] = await db
    .select({
      id: users.id,
      merchantId: users.merchantId,
      email: users.email,
      status: users.status,
      inviteExpiresAt: users.inviteExpiresAt,
    })
    .from(users)
    .where(eq(users.inviteToken, hashedToken))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "Lien d'invitation invalide ou déjà utilisé" },
      { status: 400 }
    );
  }

  if (user.status !== "pending") {
    return NextResponse.json(
      { error: "Cette invitation a déjà été acceptée" },
      { status: 400 }
    );
  }

  if (user.inviteExpiresAt && user.inviteExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "Cette invitation a expiré" },
      { status: 400 }
    );
  }

  // Hash password
  const passwordHash = await hash(password, 12);

  // Activate user
  await db
    .update(users)
    .set({
      name: name.trim(),
      passwordHash,
      status: "active",
      inviteToken: null,
      inviteExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Audit log
  await db.insert(auditLogs).values({
    merchantId: user.merchantId,
    userId: user.id,
    actor: "merchant",
    action: "team_invite_accepted",
    targetType: "user",
    targetId: String(user.id),
    details: JSON.stringify({ email: user.email }),
  });

  return NextResponse.json({ success: true });
}
