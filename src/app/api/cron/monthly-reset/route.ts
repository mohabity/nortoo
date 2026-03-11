import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, usageLogs } from "@/db/schema";
import { gt, sql } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";

/**
 * GET /api/cron/monthly-reset
 * Runs on the 1st of every month (0 0 1 * *).
 *
 * 1. Snapshot current month's usage into usageLogs (backup)
 * 2. Reset currentMonthOrders = 0 and update currentMonthStart
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("monthly-reset", async () => {
      const now = new Date();

      // Calculate the month label for the period that just ended
      // (e.g., if it's Feb 1st, the ending month is "2026-01")
      const lastMonth = new Date(now);
      lastMonth.setDate(0); // last day of previous month
      const monthLabel = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

      // ── 1. Snapshot usage for merchants with orders this month ──
      // Fetch all merchants that had orders (currentMonthOrders > 0)
      const activeMerchants = await db
        .select({
          id: merchants.id,
          currentMonthOrders: merchants.currentMonthOrders,
        })
        .from(merchants)
        .where(gt(merchants.currentMonthOrders, 0));

      let snapshots = 0;
      for (const m of activeMerchants) {
        try {
          // Upsert into usageLogs — in case recordUsage() already created a row
          await db
            .insert(usageLogs)
            .values({
              merchantId: m.id,
              month: monthLabel,
              ordersScored: m.currentMonthOrders,
              ordersBlocked: 0,
              totalValue: 0,
              blockedValue: 0,
            })
            .onConflictDoUpdate({
              target: [usageLogs.merchantId, usageLogs.month],
              set: {
                // Only update ordersScored if the snapshot value is higher
                // (recordUsage tracks in real-time, this is a safety backup)
                ordersScored: sql`GREATEST(${usageLogs.ordersScored}, ${m.currentMonthOrders})`,
                updatedAt: now,
              },
            });
          snapshots++;
        } catch (err) {
          console.error(`[monthly-reset] Snapshot failed for merchant ${m.id}:`, err);
        }
      }

      // ── 2. Reset all merchants ──
      await db
        .update(merchants)
        .set({
          currentMonthOrders: 0,
          currentMonthStart: now,
        });

      console.info(
        `[monthly-reset] Saved ${snapshots} usage snapshots for ${monthLabel}, ` +
        `reset all merchants at ${now.toISOString()}`
      );

      return { resetAt: now.toISOString(), month: monthLabel, snapshots };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[monthly-reset] Error:", err);
    return NextResponse.json(
      { error: "Reset failed" },
      { status: 500 }
    );
  }
}
