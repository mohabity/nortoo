import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/db/index";
import { users, merchants, auditLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAppUrl } from "@/lib/env";
import {
  requirePermission,
  requireActiveMerchant,
  handlePermissionError,
  ROLE_LABELS,
  type Role,
} from "@/lib/permissions";
import { getUserLimit } from "@/lib/plans";
import { sendEmail, buildTeamInviteEmail } from "@/lib/email";
import type { Locale } from "@/i18n/types";

/**
 * GET /api/team
 * List all users for the current merchant. Requires team:manage.
 */
export async function GET() {
  try {
    const ctx = await requirePermission("team:manage");

    const teamMembers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.merchantId, ctx.merchantId))
      .orderBy(users.createdAt);

    // Get plan limit
    const limit = getUserLimit(ctx.plan);

    return NextResponse.json({
      data: teamMembers,
      meta: { count: teamMembers.length, limit },
    });
  } catch (err) {
    return handlePermissionError(err);
  }
}

/**
 * POST /api/team
 * Invite a new user. Requires team:manage.
 */
const inviteSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  role: z.enum(["admin", "manager", "operator"]),
  name: z.string().min(2).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await requireActiveMerchant("team:manage");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { email, role, name } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check plan-based user limit
    const [{ count: currentCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.merchantId, ctx.merchantId));

    const limit = getUserLimit(ctx.plan);
    if (currentCount >= limit) {
      return NextResponse.json(
        {
          error: `Limite atteinte (${limit} membres pour votre plan ${ctx.plan})`,
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }

    // Check email not already taken
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Generate invite token
    const rawToken = randomBytes(48).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user with pending status
    const [newUser] = await db
      .insert(users)
      .values({
        merchantId: ctx.merchantId,
        email: normalizedEmail,
        name: name ?? normalizedEmail.split("@")[0],
        role,
        status: "pending",
        inviteToken: hashedToken,
        inviteExpiresAt,
      })
      .returning({ id: users.id });

    // Get merchant name for email
    const [merchant] = await db
      .select({ name: merchants.name, locale: merchants.locale })
      .from(merchants)
      .where(eq(merchants.id, ctx.merchantId))
      .limit(1);

    // Send invite email
    const baseUrl = getAppUrl();
    const inviteUrl = `${baseUrl}/invite?token=${rawToken}`;
    const roleLabel = ROLE_LABELS[role as Role] ?? role;
    const locale = (merchant?.locale ?? "fr") as Locale;
    const { subject, html, text } = await buildTeamInviteEmail(
      inviteUrl,
      merchant?.name ?? "nortoo",
      roleLabel,
      locale
    );

    sendEmail({
      to: normalizedEmail,
      subject,
      html,
      text,
    }).catch(() => {});

    // Audit log
    await db.insert(auditLogs).values({
      merchantId: ctx.merchantId,
      userId: ctx.userId,
      actor: "merchant",
      action: "team_invite",
      targetType: "user",
      targetId: String(newUser.id),
      details: JSON.stringify({ email: normalizedEmail, role }),
    });

    return NextResponse.json({ data: { id: newUser.id } }, { status: 201 });
  } catch (err) {
    return handlePermissionError(err);
  }
}
