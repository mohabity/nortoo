import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { customers, orders, auditLogs } from "@/db/schema";
import { and, eq, like, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { hashPhone, phoneLast4 } from "@/lib/hash";
import {
  requirePermission,
  requireActiveMerchant,
  handlePermissionError,
} from "@/lib/permissions";

// ── GET /api/crm/customers — List customers with search & filters ──

export async function GET(request: NextRequest) {
  try {
    const ctx = await requirePermission("orders:read");
    const { merchantId } = ctx;
    const url = request.nextUrl;

    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status") ?? "";
    const tag = url.searchParams.get("tag") ?? "";
    const city = url.searchParams.get("city") ?? "";

    // Build WHERE conditions
    const conditions = [eq(customers.merchantId, merchantId)];

    if (status && ["active", "inactive", "blacklisted"].includes(status)) {
      conditions.push(eq(customers.status, status));
    }

    if (search) {
      conditions.push(like(customers.name, `%${search}%`));
    }

    if (city) {
      conditions.push(eq(customers.city, city));
    }

    const where = and(...conditions);

    // Fetch customers
    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: customers.id,
          phoneHash: customers.phoneHash,
          phoneLast4: customers.phoneLast4,
          name: customers.name,
          city: customers.city,
          address: customers.address,
          totalOrders: customers.totalOrders,
          successfulOrders: customers.successfulOrders,
          failedOrders: customers.failedOrders,
          tags: customers.tags,
          status: customers.status,
          source: customers.source,
          firstSeen: customers.firstSeen,
          lastSeen: customers.lastSeen,
        })
        .from(customers)
        .where(where)
        .orderBy(desc(customers.lastSeen))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(where),
    ]);

    // Filter by tag in-memory (tags is a JSON array stored as text)
    let filtered = rows.map((r) => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
    }));

    if (tag) {
      filtered = filtered.filter(
        (r) => Array.isArray(r.tags) && r.tags.includes(tag)
      );
    }

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      customers: filtered,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return (
      handlePermissionError(err) ??
      NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    );
  }
}

// ── POST /api/crm/customers — Create a new customer ──

const createCustomerSchema = z.object({
  phone: z.string().min(5, "Numéro de téléphone requis"),
  name: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireActiveMerchant("orders:write");
    const { merchantId, userId } = ctx;

    const body = await request.json();
    const data = createCustomerSchema.parse(body);

    const phoneHash = hashPhone(data.phone);
    const last4 = phoneLast4(data.phone);

    // Check for existing customer
    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.merchantId, merchantId),
          eq(customers.phoneHash, phoneHash)
        )
      );

    if (existing) {
      return NextResponse.json(
        { error: "Ce client existe déjà", customerId: existing.id },
        { status: 409 }
      );
    }

    // Insert customer
    const [customer] = await db
      .insert(customers)
      .values({
        merchantId,
        phoneHash,
        phoneLast4: last4,
        name: data.name ?? null,
        city: data.city ?? null,
        address: data.address ?? null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: "active",
        source: "crm",
        totalOrders: 0,
        successfulOrders: 0,
        failedOrders: 0,
      })
      .returning({ id: customers.id });

    // Audit log
    await db.insert(auditLogs).values({
      merchantId,
      userId,
      actor: "merchant",
      action: "crm_create_customer",
      targetType: "customer",
      targetId: String(customer.id),
      details: JSON.stringify({ name: data.name, city: data.city }),
    });

    return NextResponse.json({ id: customer.id }, { status: 201 });
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
