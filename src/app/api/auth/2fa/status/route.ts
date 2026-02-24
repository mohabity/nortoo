import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/auth/2fa/status
 * Returns the 2FA status for the current user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const [user] = await db
    .select({
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorVerifiedAt: users.twoFactorVerifiedAt,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, Number(session.user.userId)))
    .limit(1);

  return NextResponse.json({
    data: {
      enabled: user?.twoFactorEnabled ?? false,
      verifiedAt: user?.twoFactorVerifiedAt?.toISOString() ?? null,
      role: user?.role ?? "operator",
      canEnable: user?.role === "admin" || user?.role === "manager",
    },
  });
}
