import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { supportTickets, auditLogs, merchants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getAdminId } from "@/lib/admin-auth";

/**
 * GET /api/nrt-panel/tickets/[id]
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

  const [ticket] = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      category: supportTickets.category,
      priority: supportTickets.priority,
      status: supportTickets.status,
      resolvedAt: supportTickets.resolvedAt,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      merchantId: supportTickets.merchantId,
      merchantName: merchants.name,
      merchantEmail: merchants.email,
    })
    .from(supportTickets)
    .leftJoin(merchants, eq(supportTickets.merchantId, merchants.id))
    .where(eq(supportTickets.id, ticketId));

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: ticket });
}

/**
 * PUT /api/nrt-panel/tickets/[id]
 * Admin: update ticket status
 */
const updateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export async function PUT(
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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const { status } = parsed.data;
  const resolvedAt = ["resolved", "closed"].includes(status) ? new Date() : null;

  const [ticket] = await db
    .update(supportTickets)
    .set({ status, resolvedAt, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId))
    .returning();

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Audit log
  const adminId = await getAdminId();
  await db.insert(auditLogs).values({
    merchantId: ticket.merchantId,
    actor: "admin",
    action: "admin_update_ticket",
    targetType: "ticket",
    targetId: String(ticketId),
    details: JSON.stringify({ status, resolvedAt, adminId }),
  });

  return NextResponse.json({ data: ticket });
}
