import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { ticketReplies, supportTickets, auditLogs } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { auth } from "@/auth";

/**
 * GET /api/support/tickets/[id]/replies
 * Merchant: fetch replies for a ticket (with merchant isolation)
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

    // Verify ticket belongs to this merchant
    const [ticket] = await db
      .select({ id: supportTickets.id })
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

    const replies = await db
      .select()
      .from(ticketReplies)
      .where(eq(ticketReplies.ticketId, ticketId))
      .orderBy(asc(ticketReplies.createdAt));

    return NextResponse.json({ data: replies });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

/**
 * POST /api/support/tickets/[id]/replies
 * Merchant: send a reply on a ticket
 */
const replySchema = z.object({
  message: z.string().min(1, "Message requis").max(5000),
});

export async function POST(
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

    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    // Verify ticket belongs to merchant and check status
    const [ticket] = await db
      .select({ id: supportTickets.id, status: supportTickets.status })
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

    if (ticket.status === "closed" || ticket.status === "resolved") {
      return NextResponse.json(
        { error: "Impossible de répondre à un ticket fermé" },
        { status: 400 }
      );
    }

    const senderName = session?.user?.name ?? "Marchand";

    // Insert reply
    const [reply] = await db
      .insert(ticketReplies)
      .values({
        ticketId,
        senderType: "merchant",
        senderName,
        message: parsed.data.message,
      })
      .returning();

    // Audit log (Art. 23 Loi 09-08)
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "reply_ticket",
      targetType: "ticket",
      targetId: String(ticketId),
      details: JSON.stringify({ replyId: reply.id }),
    });

    return NextResponse.json({ data: reply }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}
