import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/db/index";
import { users, merchants, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  requireActiveMerchant,
  handlePermissionError,
  ROLE_LABELS,
  type Role,
} from "@/lib/permissions";
import { sendEmail, buildTeamInviteEmail } from "@/lib/email";
import type { Locale } from "@/i18n/types";

/**
 * POST /api/team/[id]/resend
 * Resend invitation email. Requires team:manage.
 * Only works for pending users.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireActiveMerchant("team:manage");
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
        name: users.name,
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

    if (targetUser.status !== "pending") {
      return NextResponse.json(
        { error: "Cet utilisateur a déjà accepté son invitation" },
        { status: 400 }
      );
    }

    // Regenerate invite token
    const rawToken = randomBytes(48).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        inviteToken: hashedToken,
        inviteExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetId));

    // Get merchant name for email
    const [merchant] = await db
      .select({ name: merchants.name, locale: merchants.locale })
      .from(merchants)
      .where(eq(merchants.id, ctx.merchantId))
      .limit(1);

    // Send invite email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite?token=${rawToken}`;
    const roleLabel = ROLE_LABELS[targetUser.role as Role] ?? targetUser.role;
    const locale = (merchant?.locale ?? "fr") as Locale;
    const { subject, html, text } = await buildTeamInviteEmail(
      inviteUrl,
      merchant?.name ?? "nortoo",
      roleLabel,
      locale
    );

    sendEmail({
      to: targetUser.email,
      subject,
      html,
      text,
    }).catch(() => {});

    // Audit log
    await db.insert(auditLogs).values({
      merchantId: ctx.merchantId,
      userId: ctx.userId,
      actor: "merchant",
      action: "team_invite_resend",
      targetType: "user",
      targetId: String(targetId),
      details: JSON.stringify({ email: targetUser.email }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handlePermissionError(err);
  }
}
