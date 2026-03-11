import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { sendEmail, buildTrialReminderEmail } from "@/lib/email";
import type { Locale } from "@/i18n/types";

const REMINDER_DAYS = [7, 3, 1] as const;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const APP_URL = process.env.NEXTAUTH_URL || "https://app.nortoo.ma";

/**
 * GET /api/cron/trial-reminder
 *
 * Runs daily at 7am UTC (0 7 * * *), before trial-check at 9am.
 * Sends reminder emails to merchants whose trial expires in 7, 3, or 1 day(s).
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("trial-reminder", async () => {
      const now = new Date();

      // Get all merchants still on active trial
      const trialMerchants = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email,
          locale: merchants.locale,
          trialEndsAt: merchants.trialEndsAt,
        })
        .from(merchants)
        .where(
          and(
            eq(merchants.billingStatus, "trial"),
            gt(merchants.trialEndsAt, now)
          )
        );

      let sent = 0;
      let skipped = 0;
      let failed = 0;

      for (const m of trialMerchants) {
        if (!m.trialEndsAt || !m.email) {
          skipped++;
          continue;
        }

        const diffMs = m.trialEndsAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / ONE_DAY_MS);

        // Only send on exact reminder days
        if (!(REMINDER_DAYS as readonly number[]).includes(daysRemaining)) {
          skipped++;
          continue;
        }

        try {
          const locale = (m.locale || "fr") as Locale;
          const billingUrl = `${APP_URL}/dashboard/billing`;
          const emailData = await buildTrialReminderEmail(
            m.name || "Marchand",
            daysRemaining,
            billingUrl,
            locale,
          );

          const ok = await sendEmail({
            to: m.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          });

          if (ok) {
            sent++;
            console.info(
              `[trial-reminder] Sent J-${daysRemaining} reminder to ${m.email}`
            );
          } else {
            failed++;
            console.error(
              `[trial-reminder] Failed to send to ${m.email}`
            );
          }
        } catch (err) {
          failed++;
          console.error(
            `[trial-reminder] Error sending to merchant ${m.id}:`,
            err
          );
        }
      }

      console.info(
        `[trial-reminder] Done: ${sent} sent, ${skipped} skipped, ${failed} failed at ${now.toISOString()}`
      );

      return { sent, skipped, failed, total: trialMerchants.length };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[trial-reminder] Error:", err);
    return NextResponse.json(
      { error: "Trial reminder failed" },
      { status: 500 }
    );
  }
}
