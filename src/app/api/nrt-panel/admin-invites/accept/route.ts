import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/db/index";
import { adminUsers, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  adminLoginLimiter,
  getClientIp,
  safeLimit,
} from "@/lib/rate-limit";

/**
 * GET /api/nrt-panel/admin-invites/accept?token=XXX
 * Validate an admin invite token and return admin info.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || typeof token !== "string" || token.length < 10) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const hashedToken = createHash("sha256").update(token).digest("hex");

  const [admin] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      isActive: adminUsers.isActive,
      inviteExpiresAt: adminUsers.inviteExpiresAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.inviteToken, hashedToken))
    .limit(1);

  if (!admin) {
    return NextResponse.json(
      { error: "Lien d'invitation invalide ou déjà utilisé." },
      { status: 400 }
    );
  }

  if (admin.isActive) {
    return NextResponse.json(
      { error: "Cette invitation a déjà été acceptée." },
      { status: 400 }
    );
  }

  if (admin.inviteExpiresAt && admin.inviteExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "Cette invitation a expiré. Demandez un nouvel envoi." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    data: { email: admin.email, name: admin.name },
  });
}

/**
 * POST /api/nrt-panel/admin-invites/accept
 * Accept an invitation by setting a password.
 * Body: { token, name, password }
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limit
  const { success } = await safeLimit(
    adminLoginLimiter,
    `admin-invite-accept:${ip}`
  );
  if (!success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { token, name, password } = body as {
    token?: string;
    name?: string;
    password?: string;
  };

  if (
    !token ||
    !name ||
    !password ||
    typeof token !== "string" ||
    typeof name !== "string" ||
    typeof password !== "string" ||
    name.trim().length < 2 ||
    password.length < 8
  ) {
    return NextResponse.json(
      { error: "Token, nom (min. 2) et mot de passe (min. 8) requis." },
      { status: 400 }
    );
  }

  const hashedToken = createHash("sha256").update(token).digest("hex");

  // Find pending admin by invite token
  const [admin] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      isActive: adminUsers.isActive,
      inviteExpiresAt: adminUsers.inviteExpiresAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.inviteToken, hashedToken))
    .limit(1);

  if (!admin) {
    return NextResponse.json(
      { error: "Lien d'invitation invalide ou déjà utilisé." },
      { status: 400 }
    );
  }

  if (admin.isActive) {
    return NextResponse.json(
      { error: "Cette invitation a déjà été acceptée." },
      { status: 400 }
    );
  }

  if (admin.inviteExpiresAt && admin.inviteExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "Cette invitation a expiré." },
      { status: 400 }
    );
  }

  // Hash password and activate
  const passwordHash = await hash(password, 12);

  await db
    .update(adminUsers)
    .set({
      name: name.trim(),
      passwordHash,
      isActive: true,
      inviteToken: null,
      inviteExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, admin.id));

  // Audit log
  await db.insert(auditLogs).values({
    actor: "admin",
    action: "admin_invite_accepted",
    targetType: "admin_user",
    targetId: String(admin.id),
    details: JSON.stringify({ email: admin.email }),
    ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
  });

  console.info(
    `[Admin Invite] Accepted — email: ${admin.email}, adminId: ${admin.id}, IP: ${ip}`
  );

  return NextResponse.json({ ok: true });
}
