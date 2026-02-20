import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { inviteLinks } from "@/db/schema";
import { getMerchantId } from "@/lib/merchant";
import { desc } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Admin-only invite management (merchantId === 1).
 *
 * GET  /api/admin/invites — List all invites
 * POST /api/admin/invites — Create an invite
 */

async function requireAdmin() {
  const merchantId = await getMerchantId();
  if (!merchantId || merchantId !== 1) {
    return null;
  }
  return merchantId;
}

// ── GET: list invites ──
export async function GET() {
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json({
    data: invite,
    url: `${appUrl}/go/${invite.code}`,
  }, { status: 201 });
}
