import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { ticketReplies, supportTickets, auditLogs, adminUsers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { isAdmin, getAdminId } from "@/lib/admin-auth";

/**
 * GET /api/nrt-panel/tickets/[id]/replies
 * Admin: fetch all replies for a ticket
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const replies = await db
    .select()
    .from(ticketReplies)
    .where(eq(ticketReplies.ticketId, ticketId))
    .orderBy(asc(ticketReplies.createdAt));

  return NextResponse.json({ data: replies });
}

/**
 * POST /api/nrt-panel/tickets/[id]/replies
 * Admin: send a reply to a ticket
 */
const replySchema = z.object({
  message: z.string().min(1, "Message requis").max(5000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  // Verify ticket exists
  const [ticket] = await db
    .select({ id: supportTickets.id, status: supportTickets.status, merchantId: supportTickets.merchantId })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Get admin name
  const adminId = await getAdminId();
  let senderName = "Admin";
  if (adminId) {
    const [admin] = await db
      .select({ name: adminUsers.name })
      .from(adminUsers)
      .where(eq(adminUsers.id, adminId))
      .limit(1);
    if (admin?.name) senderName = admin.name;
  }

  // Insert reply
  const [reply] = await db
    .insert(ticketReplies)
    .values({
      ticketId,
      senderType: "admin",
      senderName,
      message: parsed.data.message,
    })
    .returning();

  // Auto-update status to in_progress if currently open
  if (ticket.status === "open") {
    await db
      .update(supportTickets)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));
  }

  // Audit log
  await db.insert(auditLogs).values({
    merchantId: ticket.merchantId,
    actor: "admin",
    action: "admin_reply_ticket",
    targetType: "ticket",
    targetId: String(ticketId),
    details: JSON.stringify({ replyId: reply.id, adminId }),
  });

  return NextResponse.json({ data: reply }, { status: 201 });
}
