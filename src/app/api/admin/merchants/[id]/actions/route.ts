import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("extend_trial"),
    days: z.number().int().min(1).max(365),
  }),
  z.object({
    action: z.literal("change_plan"),
    plan: z.enum(["trial", "starter", "pro", "scale"]),
  }),
  z.object({
    action: z.literal("deactivate"),
  }),
  z.object({
    action: z.literal("activate"),
  }),
]);

/**
 * POST /api/admin/merchants/[id]/actions
 * Execute admin actions on a merchant.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const merchantId = parseInt(id, 10);
    if (isNaN(merchantId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action", details: parsed.error.errors },
        { status: 400 }
      );
    }

    // Verify merchant exists
    const [merchant] = await db
      .select({
        id: merchants.id,
        plan: merchants.plan,
        billingStatus: merchants.billingStatus,
        trialEndsAt: merchants.trialEndsAt,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const action = parsed.data;
    const now = new Date();
    let details: Record<string, unknown> = {};

    switch (action.action) {
      case "extend_trial": {
        // Extend from the later of now or current trialEndsAt
        const base =
          merchant.trialEndsAt && merchant.trialEndsAt > now
            ? merchant.trialEndsAt
            : now;
        const newTrialEnd = new Date(base);
        newTrialEnd.setDate(newTrialEnd.getDate() + action.days);

        await db
          .update(merchants)
          .set({
            trialEndsAt: newTrialEnd,
            billingStatus: "trial",
            updatedAt: now,
          })
          .where(eq(merchants.id, merchantId));

        details = {
          days: action.days,
          previousEnd: merchant.trialEndsAt?.toISOString() ?? null,
          newEnd: newTrialEnd.toISOString(),
        };
        break;
      }

      case "change_plan": {
        const newBillingStatus = action.plan === "trial" ? "trial" : "active";

        await db
          .update(merchants)
          .set({
            plan: action.plan,
            billingStatus: newBillingStatus,
            updatedAt: now,
          })
          .where(eq(merchants.id, merchantId));

        details = {
          fromPlan: merchant.plan,
          toPlan: action.plan,
          billingStatus: newBillingStatus,
        };
        break;
      }

      case "deactivate": {
        await db
          .update(merchants)
          .set({
            billingStatus: "cancelled",
            updatedAt: now,
          })
          .where(eq(merchants.id, merchantId));

        details = {
          previousStatus: merchant.billingStatus,
          newStatus: "cancelled",
        };
        break;
      }

      case "activate": {
        await db
          .update(merchants)
          .set({
            billingStatus: "active",
            updatedAt: now,
          })
          .where(eq(merchants.id, merchantId));

        details = {
          previousStatus: merchant.billingStatus,
          newStatus: "active",
        };
        break;
      }
    }

    // Audit log
    await db.insert(auditLogs).values({
      merchantId,
      userId: null,
      actor: "admin",
      action: action.action,
      targetType: "merchant",
      targetId: String(merchantId),
      details: JSON.stringify(details),
    });

    return NextResponse.json({
      ok: true,
      action: action.action,
      merchantId,
      details,
    });
  } catch (err) {
    console.error("[Admin Action] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
