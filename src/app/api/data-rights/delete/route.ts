import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import {
  customers,
  orders,
  dataRightsRequests,
  auditLogs,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  requirePermission,
  handlePermissionError,
} from "@/lib/permissions";
import { hashPhone } from "@/lib/hash";

/**
 * POST /api/data-rights/delete
 * Art. 8 Loi 09-08 — Droit de suppression.
 * Anonymizes order data and deletes customer record.
 * Requires compliance:read permission (admin-only).
 */

const deleteSchema = z.object({
  phone: z.string().min(8).max(20),
  reason: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { merchantId, userId } = await requirePermission("compliance:read");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const phoneHash = hashPhone(parsed.data.phone);

    // Find customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.merchantId, merchantId),
          eq(customers.phoneHash, phoneHash)
        )
      )
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Aucun client trouvé avec ce numéro de téléphone" },
        { status: 404 }
      );
    }

    // 1. Anonymize all linked orders (keep stats: score, decision, city, total)
    const anonymized = await db
      .update(orders)
      .set({
        customerName: null,
        shippingAddress: null,
        customerPhoneLast4: null,
      })
      .where(
        and(
          eq(orders.merchantId, merchantId),
          eq(orders.customerId, customer.id)
        )
      );

    // 2. Delete customer record
    await db
      .delete(customers)
      .where(
        and(
          eq(customers.merchantId, merchantId),
          eq(customers.id, customer.id)
        )
      );

    // 3. Audit log (Art. 23)
    const [auditEntry] = await db
      .insert(auditLogs)
      .values({
        merchantId,
        userId,
        actor: "merchant",
        action: "data_rights_delete",
        targetType: "customer",
        targetId: String(customer.id),
        details: JSON.stringify({
          phoneHashPartial: phoneHash.slice(0, 12) + "...",
          ordersAnonymized: anonymized.rowCount ?? 0,
          reason:
            parsed.data.reason || "Droit de suppression (Loi 09-08 Art. 8)",
        }),
      })
      .returning({ id: auditLogs.id });

    // 4. Record data rights request
    await db.insert(dataRightsRequests).values({
      merchantId,
      requesterPhoneHash: phoneHash,
      rightType: "deletion",
      status: "completed",
      responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      auditLogId: auditEntry?.id ?? null,
    });

    return NextResponse.json({
      data: {
        status: "erased",
        ordersAnonymized: anonymized.rowCount ?? 0,
        customerDeleted: 1,
      },
    });
  } catch (err) {
    try {
      return handlePermissionError(err);
    } catch {
      console.error("[data-rights:delete]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
