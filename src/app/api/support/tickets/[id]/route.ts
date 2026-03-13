import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { supportTickets, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { auth } from "@/auth";

/**
 * GET /api/support/tickets/[id]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantId = await getMerchantId();
    const { id } = await params;
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(
        and(
          eq(supportTickets.id, ticketId),
          eq(supportTickets.merchantId, merchantId)
        )
      );

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    return NextResponse.json({ data: ticket });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

/**
 * PUT /api/support/tickets/[id]
 * Update ticket status (close/reopen)
 */
const updateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantId = await getMerchantId();
    const session = await auth();
    const userId = session?.user?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const resolvedAt = ["resolved", "closed"].includes(status) ? new Date() : null;

    const [ticket] = await db
      .update(supportTickets)
      .set({ status, resolvedAt, updatedAt: new Date() })
      .where(
        and(
          eq(supportTickets.id, ticketId),
          eq(supportTickets.merchantId, merchantId)
        )
      )
      .returning();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
    }

    // Audit log (Art. 23 Loi 09-08)
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "update_ticket",
      targetType: "ticket",
      targetId: String(ticketId),
      details: JSON.stringify({ status, resolvedAt }),
    });

    return NextResponse.json({ data: ticket });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}
