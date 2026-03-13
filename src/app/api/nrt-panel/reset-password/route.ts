import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createHash, timingSafeEqual } from "crypto";
import { db } from "@/db/index";
import { adminUsers, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  adminLoginLimiter,
  getClientIp,
  safeLimit,
} from "@/lib/rate-limit";

/**
 * POST /api/nrt-panel/reset-password
 *
 * Reset an admin password using ADMIN_SECRET as authorization.
 * Body: { secretKey, email, newPassword }
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { success } = await safeLimit(adminLoginLimiter, `admin-reset:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { secretKey, email, newPassword } = body as {
      secretKey?: string;
      email?: string;
      newPassword?: string;
    };

    // Validate secretKey against ADMIN_SECRET
    const secret = process.env.ADMIN_SETUP_KEY || process.env.ADMIN_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "ADMIN_SECRET non configuré." },
        { status: 500 }
      );
    }

    const keyBuf = Buffer.from(secretKey ?? "", "utf-8");
    const secretBuf = Buffer.from(secret, "utf-8");
    const keyValid =
      keyBuf.length === secretBuf.length &&
      timingSafeEqual(keyBuf, secretBuf);

    if (!secretKey || !keyValid) {
      return NextResponse.json(
        { error: "Clé secrète invalide." },
        { status: 401 }
      );
    }

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email et nouveau mot de passe requis." },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    // Find admin
    const [admin] = await db
      .select({ id: adminUsers.id, email: adminUsers.email })
      .from(adminUsers)
      .where(eq(adminUsers.email, email.trim().toLowerCase()))
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        { error: "Aucun admin trouvé avec cet email." },
        { status: 404 }
      );
    }

    // Update password
    const passwordHash = await hash(newPassword, 12);
    await db
      .update(adminUsers)
      .set({ passwordHash })
      .where(eq(adminUsers.id, admin.id));

    // Audit log
    await db.insert(auditLogs).values({
      actor: "admin",
      action: "admin_password_reset",
      targetType: "admin_user",
      targetId: String(admin.id),
      details: JSON.stringify({ email: admin.email, via: "secret_key" }),
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 16),
    });

    console.info(`[Admin Reset] Password reset — email: ${admin.email}, IP: ${ip}`);

    return NextResponse.json({
      ok: true,
      message: `Mot de passe réinitialisé pour ${admin.email}. Connectez-vous maintenant.`,
    });
  } catch (err) {
    console.error("[Admin Reset] Error:", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
