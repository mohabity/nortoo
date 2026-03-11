import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { db } from "@/db/index";
import { adminUsers, auditLogs } from "@/db/schema";
import { count } from "drizzle-orm";
import {
  adminLoginLimiter,
  getClientIp,
  safeLimit,
} from "@/lib/rate-limit";
import { buildAdminApprovalEmail, sendEmail } from "@/lib/email";

/**
 * GET /api/nrt-panel/setup
 * Check if initial admin setup is needed (zero admins in DB).
 */
export async function GET() {
  const [result] = await db.select({ total: count() }).from(adminUsers);
  return NextResponse.json({ needsSetup: (result?.total ?? 0) === 0 });
}

/**
 * POST /api/nrt-panel/setup
 * Create the first admin account. Only works when zero admins exist.
 *
 * Requires ADMIN_SECRET as setupKey for authorization.
 * After the first admin is created, this endpoint returns 403.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limit
  const { success } = await safeLimit(adminLoginLimiter, `admin-setup:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    // Check if any admins already exist
    const [existing] = await db.select({ total: count() }).from(adminUsers);
    if ((existing?.total ?? 0) > 0) {
      return NextResponse.json(
        { error: "Configuration déjà effectuée. Connectez-vous avec votre compte admin." },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { setupKey, email, password, name } = body as {
      setupKey?: string;
      email?: string;
      password?: string;
      name?: string;
    };

    // Validate setupKey against ADMIN_SETUP_KEY (fallback: ADMIN_SECRET)
    const secret = process.env.ADMIN_SETUP_KEY || process.env.ADMIN_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "ADMIN_SETUP_KEY non configuré sur le serveur." },
        { status: 500 }
      );
    }
    const keyBuf = Buffer.from(setupKey ?? "", "utf-8");
    const secretBuf = Buffer.from(secret, "utf-8");
    const keyValid = keyBuf.length === secretBuf.length && timingSafeEqual(keyBuf, secretBuf);
    if (!setupKey || !keyValid) {
      return NextResponse.json(
        { error: "Clé de configuration invalide." },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Tous les champs sont requis (email, mot de passe, nom)." },
        { status: 400 }
      );
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        email: String(email).trim().toLowerCase(),
        name: String(name).trim(),
        passwordHash,
        isActive: true,
      })
      .returning({ id: adminUsers.id });

    // Audit log (Art. 23)
    await db.insert(auditLogs).values({
      actor: "admin",
      action: "admin_setup",
      targetType: "admin_user",
      targetId: String(newAdmin.id),
      details: JSON.stringify({
        email: String(email).trim().toLowerCase(),
        name: String(name).trim(),
        firstAdmin: true,
      }),
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
    });

    console.info(
      `[Admin Setup] First admin created — email: ${email}, IP: ${ip}`
    );

    // Send approval request email to admin@nortoo.ma
    try {
      const approvalEmail = await buildAdminApprovalEmail(
        String(name).trim(),
        String(email).trim().toLowerCase(),
        "fr",
      );
      await sendEmail({
        to: "admin@nortoo.ma",
        subject: approvalEmail.subject,
        html: approvalEmail.html,
        text: approvalEmail.text,
      });
    } catch (approvalErr) {
      // Non-blocking: don't fail setup if approval email fails
      console.error("[Admin Setup] Approval email error:", approvalErr);
    }

    return NextResponse.json(
      {
        ok: true,
        message: `Compte admin créé pour ${String(email).trim().toLowerCase()}. Connectez-vous maintenant.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Admin Setup] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte admin." },
      { status: 500 }
    );
  }
}
