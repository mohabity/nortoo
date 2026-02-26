import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { orders, merchants, dailyMetrics, blogDailyStats } from "@/db/schema";
import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";

/**
 * GET /api/cron/daily-metrics
 * Aggregates yesterday's order data into dailyMetrics (per merchant + global).
 * Also fetches Umami blog stats if configured.
 * Schedule: 0 2 * * * (2h UTC daily)
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("daily-metrics", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

      // ── 1. Get all active merchants ──
      const allMerchants = await db
        .select({ id: merchants.id, plan: merchants.plan })
        .from(merchants);

      let merchantCount = 0;

      // ── 2. Aggregate per merchant ──
      for (const m of allMerchants) {
        const [stats] = await db
          .select({
            received: sql<number>`count(*)`,
            scored: sql<number>`count(*) filter (where ${orders.fraudScore} is not null)`,
            confirmed: sql<number>`count(*) filter (where ${orders.decision} = 'ship')`,
            rejected: sql<number>`count(*) filter (where ${orders.decision} = 'block')`,
            noResponse: sql<number>`count(*) filter (where ${orders.pipelineStatus} = 'no_response')`,
            shipped: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'shipped')`,
            delivered: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')`,
            returned: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'returned')`,
            avgScore: sql<number>`coalesce(avg(${orders.fraudScore}), 0)`,
            scoreLow: sql<number>`count(*) filter (where ${orders.fraudScore} <= 30)`,
            scoreMedium: sql<number>`count(*) filter (where ${orders.fraudScore} > 30 and ${orders.fraudScore} <= 65)`,
            scoreHigh: sql<number>`count(*) filter (where ${orders.fraudScore} > 65)`,
          })
          .from(orders)
          .where(
            and(
              eq(orders.merchantId, m.id),
              eq(orders.isTest, false),
              gte(orders.createdAt, dayStart),
              lte(orders.createdAt, dayEnd)
            )
          );

        const received = Number(stats?.received ?? 0);
        if (received === 0) continue; // Skip merchants with no orders yesterday

        await db
          .insert(dailyMetrics)
          .values({
            date: dateStr,
            merchantId: m.id,
            ordersReceived: received,
            ordersScored: Number(stats?.scored ?? 0),
            ordersConfirmed: Number(stats?.confirmed ?? 0),
            ordersRejected: Number(stats?.rejected ?? 0),
            ordersNoResponse: Number(stats?.noResponse ?? 0),
            ordersShipped: Number(stats?.shipped ?? 0),
            ordersDelivered: Number(stats?.delivered ?? 0),
            ordersReturned: Number(stats?.returned ?? 0),
            avgScore: Number(stats?.avgScore ?? 0),
            scoreLow: Number(stats?.scoreLow ?? 0),
            scoreMedium: Number(stats?.scoreMedium ?? 0),
            scoreHigh: Number(stats?.scoreHigh ?? 0),
          })
          .onConflictDoUpdate({
            target: [dailyMetrics.date, dailyMetrics.merchantId],
            set: {
              ordersReceived: sql`excluded.orders_received`,
              ordersScored: sql`excluded.orders_scored`,
              ordersConfirmed: sql`excluded.orders_confirmed`,
              ordersRejected: sql`excluded.orders_rejected`,
              ordersNoResponse: sql`excluded.orders_no_response`,
              ordersShipped: sql`excluded.orders_shipped`,
              ordersDelivered: sql`excluded.orders_delivered`,
              ordersReturned: sql`excluded.orders_returned`,
              avgScore: sql`excluded.avg_score`,
              scoreLow: sql`excluded.score_low`,
              scoreMedium: sql`excluded.score_medium`,
              scoreHigh: sql`excluded.score_high`,
            },
          });

        merchantCount++;
      }

      // ── 3. Global row (merchantId = null) ──
      const [globalStats] = await db
        .select({
          received: sql<number>`count(*)`,
          scored: sql<number>`count(*) filter (where ${orders.fraudScore} is not null)`,
          confirmed: sql<number>`count(*) filter (where ${orders.decision} = 'ship')`,
          rejected: sql<number>`count(*) filter (where ${orders.decision} = 'block')`,
          avgScore: sql<number>`coalesce(avg(${orders.fraudScore}), 0)`,
          scoreLow: sql<number>`count(*) filter (where ${orders.fraudScore} <= 30)`,
          scoreMedium: sql<number>`count(*) filter (where ${orders.fraudScore} > 30 and ${orders.fraudScore} <= 65)`,
          scoreHigh: sql<number>`count(*) filter (where ${orders.fraudScore} > 65)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.isTest, false),
            gte(orders.createdAt, dayStart),
            lte(orders.createdAt, dayEnd)
          )
        );

      // Active merchants = those with at least 1 order yesterday
      const activeMerchants = merchantCount;

      // MRR placeholder (sum of plan prices — rough approximation)
      const planPrices: Record<string, number> = {
        trial: 0,
        starter: 299,
        pro: 699,
        scale: 1499,
      };
      const mrr = allMerchants.reduce(
        (sum, m) => sum + (planPrices[m.plan ?? "trial"] ?? 0),
        0
      );

      await db
        .insert(dailyMetrics)
        .values({
          date: dateStr,
          merchantId: null,
          ordersReceived: Number(globalStats?.received ?? 0),
          ordersScored: Number(globalStats?.scored ?? 0),
          ordersConfirmed: Number(globalStats?.confirmed ?? 0),
          ordersRejected: Number(globalStats?.rejected ?? 0),
          avgScore: Number(globalStats?.avgScore ?? 0),
          scoreLow: Number(globalStats?.scoreLow ?? 0),
          scoreMedium: Number(globalStats?.scoreMedium ?? 0),
          scoreHigh: Number(globalStats?.scoreHigh ?? 0),
          mrrDh: mrr,
          activeMerchants,
        })
        .onConflictDoUpdate({
          target: [dailyMetrics.date, dailyMetrics.merchantId],
          set: {
            ordersReceived: sql`excluded.orders_received`,
            ordersScored: sql`excluded.orders_scored`,
            ordersConfirmed: sql`excluded.orders_confirmed`,
            ordersRejected: sql`excluded.orders_rejected`,
            avgScore: sql`excluded.avg_score`,
            scoreLow: sql`excluded.score_low`,
            scoreMedium: sql`excluded.score_medium`,
            scoreHigh: sql`excluded.score_high`,
            mrrDh: sql`excluded.mrr_dh`,
            activeMerchants: sql`excluded.active_merchants`,
          },
        });

      // ── 4. Blog stats from Umami (optional) ──
      let blogStats = null;
      if (process.env.UMAMI_API_URL && process.env.UMAMI_API_TOKEN && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
        try {
          const umamiBase = process.env.UMAMI_API_URL.replace(/\/$/, "");
          const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
          const startAt = dayStart.getTime();
          const endAt = dayEnd.getTime();

          const statsRes = await fetch(
            `${umamiBase}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.UMAMI_API_TOKEN}`,
                Accept: "application/json",
              },
            }
          );

          if (statsRes.ok) {
            const data = await statsRes.json();
            await db
              .insert(blogDailyStats)
              .values({
                date: dateStr,
                totalPageviews: data.pageviews?.value ?? 0,
                uniqueVisitors: data.visitors?.value ?? 0,
              })
              .onConflictDoUpdate({
                target: blogDailyStats.date,
                set: {
                  totalPageviews: sql`excluded.total_pageviews`,
                  uniqueVisitors: sql`excluded.unique_visitors`,
                },
              });
            blogStats = { pageviews: data.pageviews?.value, visitors: data.visitors?.value };
          }
        } catch (err) {
          console.error("[daily-metrics] Umami fetch failed:", err);
        }
      }

      console.log(
        `[daily-metrics] Aggregated ${dateStr}: ${merchantCount} merchants, global=${Number(globalStats?.received ?? 0)} orders`
      );

      return {
        date: dateStr,
        merchantsProcessed: merchantCount,
        globalOrders: Number(globalStats?.received ?? 0),
        mrr,
        activeMerchants,
        blogStats,
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[daily-metrics] Critical error:", err);
    return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
  }
}
