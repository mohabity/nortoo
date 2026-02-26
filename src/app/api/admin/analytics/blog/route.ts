import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogDailyStats } from "@/db/schema";
import { gte, desc } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/blog?range=7d|30d|90d
 * Returns blog analytics from blogDailyStats (aggregated from Umami).
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = request.nextUrl.searchParams.get("range") ?? "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(blogDailyStats)
    .where(gte(blogDailyStats.date, sinceStr))
    .orderBy(desc(blogDailyStats.date));

  // Aggregate totals
  let totalPageviews = 0;
  let totalVisitors = 0;
  let totalCtaClicks = 0;
  let totalBlogToSignup = 0;

  for (const row of rows) {
    totalPageviews += row.totalPageviews;
    totalVisitors += row.uniqueVisitors;
    totalCtaClicks += row.ctaClicks;
    totalBlogToSignup += row.blogToSignup;
  }

  // Parse top articles from latest day
  let topArticles: unknown[] = [];
  let topReferrers: unknown[] = [];
  let topCountries: unknown[] = [];

  if (rows.length > 0) {
    const latest = rows[0];
    try {
      topArticles = latest.topArticles ? JSON.parse(latest.topArticles) : [];
    } catch {}
    try {
      topReferrers = latest.topReferrers ? JSON.parse(latest.topReferrers) : [];
    } catch {}
    try {
      topCountries = latest.topCountries ? JSON.parse(latest.topCountries) : [];
    } catch {}
  }

  return NextResponse.json({
    kpis: {
      totalPageviews,
      totalVisitors,
      totalCtaClicks,
      totalBlogToSignup,
      conversionRate:
        totalVisitors > 0
          ? Math.round((totalBlogToSignup / totalVisitors) * 10000) / 100
          : 0,
    },
    series: rows.reverse().map((r) => ({
      date: r.date,
      pageviews: r.totalPageviews,
      visitors: r.uniqueVisitors,
      ctaClicks: r.ctaClicks,
    })),
    topArticles,
    topReferrers,
    topCountries,
    range,
  });
}
