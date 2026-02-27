import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@/db/index";
import { adminUsers, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { isAdmin, getAdminId } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/rate-limit";
import {
  buildAdminInviteEmail,
  buildAdminApprovalEmail,
  sendEmail,
} from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.nortoo.ma";

/**
 * GET /api/nrt-panel/admin-invites
 * List all admin users (active + pending).
 */
export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admins = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      isActive: adminUsers.isActive,
      invitedBy: adminUsers.invitedBy,
      lastLoginAt: adminUsers.lastLoginAt,
      createdAt: adminUsers.createdAt,
      hasPassword: adminUsers.passwordHash,
      inviteExpiresAt: adminUsers.inviteExpiresAt,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));

  // Resolve inviter names and compute status
  const inviterIds = [...new Set(admins.map((a) => a.invitedBy).filter(Boolean))] as number[];
  const inviters =
    inviterIds.length > 0
      ? await db
          .select({ id: adminUsers.id, name: adminUsers.name })
          .from(adminUsers)
      : [];
  const inviterMap = Object.fromEntries(inviters.map((i) => [i.id, i.name]));

  const data = admins.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    isActive: a.isActive,
    status: a.isActive
      ? "active"
      : a.hasPassword
        ? "inactive"
        : "pending",
    invitedByName: a.invitedBy ? inviterMap[a.invitedBy] ?? null : null,
    inviteExpired:
      !a.isActive && !a.hasPassword && a.inviteExpiresAt
        ? a.inviteExpiresAt < new Date()
        : false,
    lastLoginAt: a.lastLoginAt,
    createdAt: a.createdAt,
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/nrt-panel/admin-invites
 * Invite a new admin by email.
 * Body: { email, name }
 */
export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const adminId = await getAdminId();
  const ip = getClientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { email, name } = body as { email?: string; name?: string };

  if (
    !email ||
    !name ||
    typeof email !== "string" ||
    typeof name !== "string" ||
    name.trim().length < 2
  ) {
    return NextResponse.json(
      { error: "Email et nom requis (nom min. 2 caractères)." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Un compte admin avec cet email existe déjà." },
      { status: 409 }
    );
  }

  // Generate invite token (384 bits of entropy)
  const rawToken = randomBytes(48).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Insert pending admin
  const [newAdmin] = await db
    .insert(adminUsers)
    .values({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: null,
      isActive: false,
      inviteToken: tokenHash,
      inviteExpiresAt: expiresAt,
      invitedBy: adminId,
    })
    .returning({ id: adminUsers.id });

  // Build invite URL
  const inviteUrl = `${APP_URL}/nrt-panel/accept-invite?token=${rawToken}`;

  // Get inviter name for email
  let inviterName = "Admin";
  if (adminId) {
    const [inviter] = await db
      .select({ name: adminUsers.name })
      .from(adminUsers)
      .where(eq(adminUsers.id, adminId))
      .limit(1);
    if (inviter) inviterName = inviter.name;
  }

  // Send invite email
  try {
    const built = await buildAdminInviteEmail(inviteUrl, inviterName, "fr");
    await sendEmail({
      to: normalizedEmail,
      subject: built.subject,
      html: built.html,
      text: built.text,
    });
  } catch (emailErr) {
    console.error("[Admin Invite] Email send error:", emailErr);
  }

  // Send approval notification to admin@nortoo.ma
  try {
    const approval = await buildAdminApprovalEmail(name.trim(), normalizedEmail, "fr");
    await sendEmail({
      to: "admin@nortoo.ma",
      subject: approval.subject,
      html: approval.html,
      text: approval.text,
    });
  } catch (approvalErr) {
    console.error("[Admin Invite] Approval email error:", approvalErr);
  }

  // Audit log
  await db.insert(auditLogs).values({
    actor: "admin",
    action: "admin_invite",
    targetType: "admin_user",
    targetId: String(newAdmin.id),
    details: JSON.stringify({
      email: normalizedEmail,
      name: name.trim(),
      invitedBy: adminId,
    }),
    ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
  });

  console.info(
    `[Admin Invite] Invitation sent — email: ${normalizedEmail}, by admin: ${adminId}, IP: ${ip}`
  );

  return NextResponse.json({ ok: true, id: newAdmin.id }, { status: 201 });
}
