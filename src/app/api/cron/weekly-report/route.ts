import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { merchants, orders } from "@/db/schema";
import { and, eq, gte, lte, sql, count, avg, ne } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { sendEmail, buildWeeklyReportEmail, type WeeklyReport } from "@/lib/email";
import { withCronMonitoring } from "@/lib/cron-monitor";

/**
 * GET /api/cron/weekly-report
 *
 * Runs every Monday at 9:00 UTC (0 9 * * 1).
 * Sends a weekly summary email to each active merchant with:
 * - Total orders scored, blocked, flagged, shipped, verified
 * - Average fraud score
 * - Savings estimate (blocked × RTO cost)
 * - Delivery feedback (delivered vs returned)
 * - Top risk cities
 * - Week-over-week comparison
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("weekly-report", async () => {
      // Calculate date ranges
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setUTCHours(0, 0, 0, 0);
      // weekEnd = today at 00:00 UTC (Monday)

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);
      // weekStart = 7 days ago at 00:00 UTC (previous Monday)

      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      // prevWeekStart = 14 days ago (for week-over-week)

      // Find all active merchants (not cancelled)
      const activeMerchants = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email,
          rtoCostFixed: merchants.rtoCostFixed,
          rtoCostPercent: merchants.rtoCostPercent,
        })
        .from(merchants)
        .where(ne(merchants.billingStatus, "cancelled"));

      let sent = 0;
      let skipped = 0;
      let failed = 0;

      for (const merchant of activeMerchants) {
        try {
          // ── Current week stats ──
          const [weekStats] = await db
            .select({
              total: count(),
              avgScore: avg(orders.fraudScore),
              totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
              shipped: sql<number>`COUNT(*) FILTER (WHERE ${orders.decision} = 'ship')`,
              verified: sql<number>`COUNT(*) FILTER (WHERE ${orders.decision} = 'verify')`,
              flagged: sql<number>`COUNT(*) FILTER (WHERE ${orders.decision} = 'flag')`,
              blocked: sql<number>`COUNT(*) FILTER (WHERE ${orders.decision} = 'block')`,
              blockedRevenue: sql<number>`COALESCE(SUM(${orders.total}) FILTER (WHERE ${orders.decision} = 'block'), 0)`,
              delivered: sql<number>`COUNT(*) FILTER (WHERE ${orders.deliveryStatus} = 'delivered')`,
              returned: sql<number>`COUNT(*) FILTER (WHERE ${orders.deliveryStatus} = 'returned')`,
            })
            .from(orders)
            .where(
              and(
                eq(orders.merchantId, merchant.id),
                eq(orders.isTest, false),
                gte(orders.createdAt, weekStart),
                lte(orders.createdAt, weekEnd)
              )
            );

          // Skip if no orders this week
          if (!weekStats || weekStats.total === 0) {
            skipped++;
            continue;
          }

          // ── Previous week stats (for comparison) ──
          const [prevStats] = await db
            .select({
              total: count(),
              blocked: sql<number>`COUNT(*) FILTER (WHERE ${orders.decision} = 'block')`,
            })
            .from(orders)
            .where(
              and(
                eq(orders.merchantId, merchant.id),
                eq(orders.isTest, false),
                gte(orders.createdAt, prevWeekStart),
                lte(orders.createdAt, weekStart)
              )
            );

          // ── Top risk cities ──
          const topCities = await db
            .select({
              city: orders.shippingCity,
              total: count(),
              blocked: sql<number>`COUNT(*) FILTER (WHERE ${orders.decision} = 'block')`,
            })
            .from(orders)
            .where(
              and(
                eq(orders.merchantId, merchant.id),
                eq(orders.isTest, false),
                gte(orders.createdAt, weekStart),
                lte(orders.createdAt, weekEnd),
                sql`${orders.shippingCity} IS NOT NULL`
              )
            )
            .groupBy(orders.shippingCity)
            .orderBy(sql`COUNT(*) FILTER (WHERE ${orders.decision} = 'block') DESC`)
            .limit(5);

          // ── Calculate savings ──
          const blockedCount = Number(weekStats.blocked) || 0;
          const blockedRev = Number(weekStats.blockedRevenue) || 0;
          const savings = Math.round(
            blockedCount * merchant.rtoCostFixed + blockedRev * merchant.rtoCostPercent
          );

          // ── Build report data ──
          const reportData: WeeklyReport = {
            merchantName: merchant.name,
            merchantEmail: merchant.email,
            weekStart: weekStart.toISOString().slice(0, 10),
            weekEnd: weekEnd.toISOString().slice(0, 10),
            totalOrders: weekStats.total,
            blockedOrders: blockedCount,
            flaggedOrders: Number(weekStats.flagged) || 0,
            verifiedOrders: Number(weekStats.verified) || 0,
            shippedOrders: Number(weekStats.shipped) || 0,
            avgScore: Math.round(Number(weekStats.avgScore) || 0),
            totalRevenue: Number(weekStats.totalRevenue) || 0,
            blockedRevenue: blockedRev,
            savings,
            deliveredCount: Number(weekStats.delivered) || 0,
            returnedCount: Number(weekStats.returned) || 0,
            topRiskCities: topCities
              .filter((c) => c.city)
              .map((c) => ({
                city: c.city!,
                orders: c.total,
                blockRate: c.total > 0 ? (Number(c.blocked) / c.total) * 100 : 0,
              })),
            prevWeekOrders: prevStats?.total ?? undefined,
            prevWeekBlocked: prevStats ? Number(prevStats.blocked) || 0 : undefined,
          };

          // ── Build and send email ──
          const { subject, html, text } = await buildWeeklyReportEmail(reportData);
          const ok = await sendEmail({
            to: merchant.email,
            subject,
            html,
            text,
          });

          if (ok) {
            sent++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`[weekly-report] Error for merchant ${merchant.id}:`, err);
          failed++;
        }
      }

      console.log(
        `[weekly-report] Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed} at ${now.toISOString()}`
      );

      return { sent, skipped, failed, totalMerchants: activeMerchants.length };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[weekly-report] Error:", err);
    return NextResponse.json(
      { error: "Weekly report cron failed" },
      { status: 500 }
    );
  }
}
