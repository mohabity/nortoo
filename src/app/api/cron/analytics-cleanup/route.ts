import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { productEvents } from "@/db/schema";
import { lt } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";

/**
 * GET /api/cron/analytics-cleanup
 * Cleans up old product events (> 180 days).
 * blogDailyStats are kept indefinitely (already aggregated).
 * Schedule: 0 3 * * 0 (Sunday 3h UTC)
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("analytics-cleanup", async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 180);

      const deleted = await db
        .delete(productEvents)
        .where(lt(productEvents.createdAt, cutoff))
        .returning({ id: productEvents.id });

      console.log(
        `[analytics-cleanup] Purged ${deleted.length} product events older than 180 days`
      );

      return {
        purgedEvents: deleted.length,
        cutoffDate: cutoff.toISOString(),
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[analytics-cleanup] Critical error:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
