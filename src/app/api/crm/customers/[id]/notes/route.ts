import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { customerNotes, customers, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  requirePermission,
  requireActiveMerchant,
  handlePermissionError,
} from "@/lib/permissions";

// ── GET /api/crm/customers/[id]/notes — List notes for a customer ──

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("orders:read");
    const { merchantId } = ctx;
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Verify customer belongs to merchant
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.merchantId, merchantId))
      );

    if (!customer) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    const notes = await db
      .select({
        id: customerNotes.id,
        content: customerNotes.content,
        type: customerNotes.type,
        createdBy: customerNotes.createdBy,
        createdAt: customerNotes.createdAt,
        authorName: users.name,
      })
      .from(customerNotes)
      .leftJoin(users, eq(customerNotes.createdBy, users.id))
      .where(
        and(
          eq(customerNotes.customerId, customerId),
          eq(customerNotes.merchantId, merchantId)
        )
      )
      .orderBy(desc(customerNotes.createdAt));

    return NextResponse.json({ notes });
  } catch (err) {
    return (
      handlePermissionError(err) ??
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}

// ── POST /api/crm/customers/[id]/notes — Add a note ──

const createNoteSchema = z.object({
  content: z.string().min(1, "Contenu requis").max(2000),
  type: z.enum(["note", "call", "delivery_update"]).optional().default("note"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireActiveMerchant("orders:write");
    const { merchantId, userId } = ctx;
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Verify customer belongs to merchant
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.merchantId, merchantId))
      );

    if (!customer) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const data = createNoteSchema.parse(body);

    const [note] = await db
      .insert(customerNotes)
      .values({
        merchantId,
        customerId,
        content: data.content,
        type: data.type,
        createdBy: userId,
      })
      .returning({ id: customerNotes.id, createdAt: customerNotes.createdAt });

    return NextResponse.json(
      { id: note.id, createdAt: note.createdAt },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: err.errors },
        { status: 400 }
      );
    }
    return (
      handlePermissionError(err) ??
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}
