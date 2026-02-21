import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import {
  customers,
  oppositionList,
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
 * POST /api/data-rights/oppose
 * Art. 9 Loi 09-08 — Droit d'opposition.
 * Registers consumer opposition to scoring. Their future orders will not be scored.
 * Requires compliance:read permission (admin-only).
 */

const opposeSchema = z.object({
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

    const parsed = opposeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const phoneHash = hashPhone(parsed.data.phone);

    // 1. Mark customer as opposed (if exists)
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

    if (customer) {
      await db
        .update(customers)
        .set({ isOpposed: true })
        .where(eq(customers.id, customer.id));
    }

    // 2. Insert into opposition list (unique index will prevent duplicates)
    try {
      await db.insert(oppositionList).values({
        phoneHash,
        merchantId,
        reason:
          parsed.data.reason || "Droit d'opposition (Loi 09-08 Art. 9)",
      });
    } catch (err: unknown) {
      // Unique constraint violation = already opposed, that's OK
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("unique") && !message.includes("duplicate")) {
        throw err;
      }
    }

    // 3. Audit log (Art. 23)
    const [auditEntry] = await db
      .insert(auditLogs)
      .values({
        merchantId,
        userId,
        actor: "merchant",
        action: "data_rights_oppose",
        targetType: "customer",
        targetId: customer ? String(customer.id) : phoneHash.slice(0, 12),
        details: JSON.stringify({
          phoneHashPartial: phoneHash.slice(0, 12) + "...",
          customerExisted: !!customer,
          reason:
            parsed.data.reason || "Droit d'opposition (Loi 09-08 Art. 9)",
        }),
      })
      .returning({ id: auditLogs.id });

    // 4. Record data rights request
    await db.insert(dataRightsRequests).values({
      merchantId,
      requesterPhoneHash: phoneHash,
      rightType: "opposition",
      status: "completed",
      responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      auditLogId: auditEntry?.id ?? null,
    });

    return NextResponse.json({
      data: {
        status: "opposed",
        customerExisted: !!customer,
        message: "Le consommateur a été enregistré en opposition. Ses futures commandes ne seront pas scorées.",
      },
    });
  } catch (err) {
    try {
      return handlePermissionError(err);
    } catch {
      console.error("[data-rights:oppose]", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
}
