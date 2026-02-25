import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { cronRuns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { getMerchantId } from "@/lib/merchant";

/**
 * GET /api/cron/health
 * Returns the health status of all cron jobs.
 * Accessible via CRON_SECRET OR authenticated merchant session.
 *
 * For each cron: last run, status, duration, overdue check.
 */

// Expected schedule per cron (in hours between runs)
const CRON_SCHEDULES: Record<string, { intervalHours: number; label: string }> = {
  "escalate":          { intervalHours: 0.25, label: "Every 15 min" },
  "webhook-retry":     { intervalHours: 0.017, label: "Every minute" },
  "purge-expired":     { intervalHours: 24, label: "Daily 3 AM" },
  "youcan-poll":       { intervalHours: 24, label: "Daily 6 AM" },
  "trial-check":       { intervalHours: 24, label: "Daily 9 AM" },
  "mark-overdue":      { intervalHours: 24, label: "Daily 8 AM" },
  "weekly-report":     { intervalHours: 168, label: "Weekly Monday 9 AM" },
  "monthly-reset":     { intervalHours: 730, label: "Monthly 1st" },
  "generate-invoices": { intervalHours: 730, label: "Monthly 2nd" },
};

// Grace period multiplier (how much overdue before alerting)
const OVERDUE_MULTIPLIER = 1.5;

interface CronStatus {
  name: string;
  schedule: string;
  lastRun: string | null;
  lastStatus: string | null;
  lastDurationMs: number | null;
  lastError: string | null;
  isOverdue: boolean;
  status: "healthy" | "warning" | "critical";
}

export async function GET(request: Request) {
  // Allow access via CRON_SECRET or authenticated merchant session
  const hasCronAuth = verifyCronSecret(request);
  if (!hasCronAuth) {
    try {
      await getMerchantId(); // throws if not authenticated
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const cronNames = Object.keys(CRON_SCHEDULES);

  // Fetch the latest run for each cron in parallel
  const lastRuns = await Promise.all(
    cronNames.map(async (name) => {
      const [run] = await db
        .select({
          cronName: cronRuns.cronName,
          status: cronRuns.status,
          startedAt: cronRuns.startedAt,
          finishedAt: cronRuns.finishedAt,
          durationMs: cronRuns.durationMs,
          error: cronRuns.error,
        })
        .from(cronRuns)
        .where(eq(cronRuns.cronName, name))
        .orderBy(desc(cronRuns.startedAt))
        .limit(1);
      return { name, run: run ?? null };
    })
  );

  const crons: CronStatus[] = lastRuns.map(({ name, run }) => {
    const schedule = CRON_SCHEDULES[name];
    const maxAge = schedule.intervalHours * OVERDUE_MULTIPLIER * 3600 * 1000;

    let isOverdue = false;
    let status: CronStatus["status"] = "healthy";

    if (!run) {
      // Never ran — might be new or never triggered
      isOverdue = true;
      status = "warning";
    } else {
      const elapsed = now.getTime() - new Date(run.startedAt).getTime();
      isOverdue = elapsed > maxAge;

      if (run.status === "error") {
        status = "critical";
      } else if (isOverdue) {
        status = "warning";
      }
    }

    return {
      name,
      schedule: schedule.label,
      lastRun: run?.startedAt ? new Date(run.startedAt).toISOString() : null,
      lastStatus: run?.status ?? null,
      lastDurationMs: run?.durationMs ?? null,
      lastError: run?.error ?? null,
      isOverdue,
      status,
    };
  });

  // Overall status
  const hasCritical = crons.some((c) => c.status === "critical");
  const hasWarning = crons.some((c) => c.status === "warning");
  const overallStatus = hasCritical ? "critical" : hasWarning ? "degraded" : "healthy";

  return NextResponse.json({
    status: overallStatus,
    checkedAt: now.toISOString(),
    crons,
  });
}
