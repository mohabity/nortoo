import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-key";
import { sendVerificationEmail } from "@/lib/email-verification";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100),
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(100),
});

/**
 * POST /api/auth/register
 *
 * Creates a new merchant account with email + bcrypt-hashed password.
 * Generates an API key for webhook auth.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON invalide" },
      { status: 400 }
    );
  }

  // Validate input
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Données invalides";
    return NextResponse.json(
      { error: firstError },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  // Check if email already exists
  const [existing] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Un compte avec cet email existe déjà" },
      { status: 409 }
    );
  }

  // Hash password (12 rounds)
  const passwordHash = await hash(password, 12);

  // Generate API key for webhook auth
  const apiKey = generateApiKey();

  // Insert new merchant
  const [newMerchant] = await db
    .insert(merchants)
    .values({
      name,
      email,
      passwordHash,
      apiKey,
      plan: "trial",
      dataRetentionMonths: 24,
    })
    .returning({ id: merchants.id });

  // Audit log (Art. 23)
  await db.insert(auditLogs).values({
    merchantId: newMerchant.id,
    actor: "merchant",
    action: "register",
    targetType: "merchant",
    targetId: String(newMerchant.id),
    details: JSON.stringify({ email, name }),
  });

  // Send verification email (non-blocking — don't fail registration)
  sendVerificationEmail(newMerchant.id, email).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
