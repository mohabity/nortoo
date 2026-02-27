import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { inviteLinks } from "@/db/schema";
import { auth } from "@/auth";
import { desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getAppUrl } from "@/lib/env";

/**
 * Admin-only invite management.
 * Access controlled by PLATFORM_ADMIN_EMAILS env var (session-based auth).
 *
 * GET  /api/nrt-panel/invites — List all invites
 * POST /api/nrt-panel/invites — Create an invite
 */

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  if (!PLATFORM_ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return null;
  }
  return session.user.merchantId;
}

// ── GET: list invites ──
export async function GET() {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(inviteLinks)
    .orderBy(desc(inviteLinks.createdAt));

  return NextResponse.json({ data: rows });
}

// ── POST: create invite ──
export async function POST(request: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const body = await request.json();
  const code = body.code || randomBytes(6).toString("hex").toUpperCase();
  const label = body.label || "Invitation";
  const maxUses = body.maxUses ?? null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

  const [invite] = await db
    .insert(inviteLinks)
    .values({
      code,
      label,
      maxUses,
      expiresAt,
      createdBy: admin,
      metadata,
    })
    .returning();

  const appUrl = getAppUrl();

  return NextResponse.json({
    data: invite,
    url: `${appUrl}/go/${invite.code}`,
  }, { status: 201 });
}
