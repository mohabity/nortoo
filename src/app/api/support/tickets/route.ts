import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { supportTickets, auditLogs } from "@/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { getMerchantId } from "@/lib/merchant";
import { auth } from "@/auth";

const PER_PAGE = 10;

/**
 * GET /api/support/tickets?page=1&status=open
 */
export async function GET(request: Request) {
  try {
    const merchantId = await getMerchantId();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const status = searchParams.get("status"); // open | in_progress | resolved | closed | null (all)

    const conditions = [eq(supportTickets.merchantId, merchantId)];
    if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
      conditions.push(eq(supportTickets.status, status));
    }

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ total: count() })
      .from(supportTickets)
      .where(where);

    const total = totalResult?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

    const data = await db
      .select()
      .from(supportTickets)
      .where(where)
      .orderBy(desc(supportTickets.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE);

    return NextResponse.json({
      data,
      meta: { page, totalPages, total },
    });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

/**
 * POST /api/support/tickets
 */
const createSchema = z.object({
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  category: z.enum(["scoring", "orders", "integration", "billing", "other"]).default("other"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export async function POST(request: Request) {
  try {
    const merchantId = await getMerchantId();
    const session = await auth();
    const userId = session?.user?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { subject, description, category, priority } = parsed.data;

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        merchantId,
        userId,
        subject,
        description,
        category,
        priority,
      })
      .returning();

    // Audit log (Art. 23 Loi 09-08)
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "create_ticket",
      targetType: "ticket",
      targetId: String(ticket.id),
      details: JSON.stringify({ subject, category, priority }),
    });

    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}
