import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, auditLogs } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";

/**
 * GET /api/cron/trial-check
 *
 * Runs daily at 9am UTC (0 9 * * *).
 * Finds all merchants with expired trials (billingStatus = "trial" AND trialEndsAt <= now)
 * and sets their billingStatus to "past_due".
 *
 * This blocks further order scoring until they upgrade to a paid plan.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("trial-check", async () => {
      const now = new Date();

      // Find all merchants with expired trials
      const expiredMerchants = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email,
          trialEndsAt: merchants.trialEndsAt,
        })
        .from(merchants)
        .where(
          and(
            eq(merchants.billingStatus, "trial"),
            lte(merchants.trialEndsAt, now)
          )
        );

      // Update billingStatus to "past_due" for all expired merchants
      let updated = 0;
      for (const m of expiredMerchants) {
        try {
          await db
            .update(merchants)
            .set({ billingStatus: "past_due", updatedAt: now })
            .where(eq(merchants.id, m.id));

          // Audit log (Art. 23)
          await db.insert(auditLogs).values({
            merchantId: m.id,
            actor: "system",
            action: "trial_expired",
            targetType: "merchant",
            targetId: String(m.id),
            details: JSON.stringify({
              trialEndsAt: m.trialEndsAt?.toISOString(),
              newBillingStatus: "past_due",
            }),
          });

          updated++;
        } catch (err) {
          console.error(`[trial-check] Error updating merchant ${m.id}:`, err);
        }
      }

      console.log(
        `[trial-check] Expired ${updated}/${expiredMerchants.length} trials at ${now.toISOString()}`
      );

      return { expired: updated, total: expiredMerchants.length };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[trial-check] Error:", err);
    return NextResponse.json(
      { error: "Trial check failed" },
      { status: 500 }
    );
  }
}
