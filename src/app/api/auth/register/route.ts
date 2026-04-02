import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db/index";
import { merchants, users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-key";
import { sendVerificationEmail } from "@/lib/email-verification";
import { buildWelcomeEmail, sendEmail } from "@/lib/email";
import { authLimiter, getClientIp, isRateLimitConfigured, safeLimit } from "@/lib/rate-limit";
import { getAppUrl } from "@/lib/env";
import type { Locale } from "@/i18n/types";

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
  locale: z.enum(["fr", "en"]).optional().default("fr"),
});

/**
 * POST /api/auth/register
 *
 * Creates a new merchant account with email + bcrypt-hashed password.
 * Generates an API key for webhook auth.
 */
export async function POST(request: Request) {
  // ── Rate limiting ──
  {
    const ip = getClientIp(request);
    const { success, reset } = await safeLimit(authLimiter, `register:${ip}`);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une minute." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

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

  const { name, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const locale = parsed.data.locale as Locale;

  // Check if email already exists (merchants or users)
  const [existingMerchant] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.email, email))
    .limit(1);

  if (existingMerchant) {
    return NextResponse.json(
      { error: "Un compte avec cet email existe déjà" },
      { status: 409 }
    );
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: "Un compte avec cet email existe déjà" },
      { status: 409 }
    );
  }

  // Hash password (12 rounds)
  const passwordHash = await hash(password, 12);

  // Generate API key for webhook auth
  const { key: apiKey, hash: apiKeyHash } = generateApiKey();

  // Insert new merchant
  const [newMerchant] = await db
    .insert(merchants)
    .values({
      name,
      email,
      passwordHash,
      apiKey,
      apiKeyHash,
      locale,
      plan: "trial",
      billingStatus: "trial",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      currentMonthStart: new Date(),
      dataRetentionMonths: 24,
    })
    .returning({ id: merchants.id });

  // Create admin user row
  const [newUser] = await db
    .insert(users)
    .values({
      merchantId: newMerchant.id,
      email,
      name,
      passwordHash,
      role: "admin",
      status: "active",
    })
    .returning({ id: users.id });

  // Audit log (Art. 23)
  await db.insert(auditLogs).values({
    merchantId: newMerchant.id,
    userId: newUser.id,
    actor: "merchant",
    action: "register",
    targetType: "merchant",
    targetId: String(newMerchant.id),
    details: JSON.stringify({ email, name }),
  });

  // Send verification email (non-blocking — don't fail registration)
  sendVerificationEmail(newMerchant.id, email, locale).catch(() => {});

  // Send welcome email (non-blocking)
  const APP_URL = getAppUrl();
  buildWelcomeEmail(name, `${APP_URL}/dashboard`, locale)
    .then((built) =>
      sendEmail({
        to: email,
        subject: built.subject,
        html: built.html,
        text: built.text,
      })
    )
    .catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
