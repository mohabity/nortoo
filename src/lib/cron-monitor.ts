/**
 * Cron Monitor — Generic wrapper that logs every cron run to `cron_runs`.
 *
 * Usage:
 *   return withCronMonitoring("escalate", async () => {
 *     // ... cron logic ...
 *     return { escalated: 5, checked: 50 };
 *   });
 */

import { db } from "@/db/index";
import { cronRuns } from "@/db/schema";

export interface CronResult<T = Record<string, unknown>> {
  metrics: T;
}

/**
 * Wraps a cron handler with monitoring:
 * 1. Records start time
 * 2. Executes the handler
 * 3. Logs the result (success or error) with duration + metrics
 * 4. Returns the handler's result
 */
export async function withCronMonitoring<T extends Record<string, unknown>>(
  cronName: string,
  handler: () => Promise<T>
): Promise<T> {
  const startedAt = new Date();

  try {
    const result = await handler();
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    // Log success
    await db.insert(cronRuns).values({
      cronName,
      status: "success",
      startedAt,
      finishedAt,
      durationMs,
      metrics: JSON.stringify(result),
    });

    return result;
  } catch (error) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const errMsg =
      error instanceof Error ? error.message : String(error);

    // Log error
    await db
      .insert(cronRuns)
      .values({
        cronName,
        status: "error",
        startedAt,
        finishedAt,
        durationMs,
        error: errMsg.substring(0, 2000),
        metrics: null,
      })
      .catch(() => {
        // If we can't even log the error, fail silently
        console.error(`[CronMonitor] Failed to log error for ${cronName}:`, errMsg);
      });

    throw error; // Re-throw so Vercel sees the failure
  }
}
