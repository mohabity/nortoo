import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles, blogTopics, blogConfig } from "@/db/schema";
import { eq, count, sql, and } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalArticles] = await db
    .select({ cnt: count() })
    .from(blogArticles);

  const [publishedFr] = await db
    .select({ cnt: count() })
    .from(blogArticles)
    .where(
      and(
        eq(blogArticles.status, "published"),
        eq(blogArticles.locale, "fr")
      )
    );

  const [publishedEn] = await db
    .select({ cnt: count() })
    .from(blogArticles)
    .where(
      and(
        eq(blogArticles.status, "published"),
        eq(blogArticles.locale, "en")
      )
    );

  const [failedArticles] = await db
    .select({ cnt: count() })
    .from(blogArticles)
    .where(eq(blogArticles.status, "failed"));

  const [queuedTopics] = await db
    .select({ cnt: count() })
    .from(blogTopics)
    .where(eq(blogTopics.status, "queued"));

  const [failedTopics] = await db
    .select({ cnt: count() })
    .from(blogTopics)
    .where(eq(blogTopics.status, "failed"));

  const [avgQuality] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${blogArticles.qualityScore}), 0)`,
    })
    .from(blogArticles)
    .where(eq(blogArticles.status, "published"));

  const [config] = await db.select().from(blogConfig).limit(1);

  return NextResponse.json({
    stats: {
      totalArticles: totalArticles?.cnt ?? 0,
      publishedFr: publishedFr?.cnt ?? 0,
      publishedEn: publishedEn?.cnt ?? 0,
      failedArticles: failedArticles?.cnt ?? 0,
      queuedTopics: queuedTopics?.cnt ?? 0,
      failedTopics: failedTopics?.cnt ?? 0,
      avgQualityScore: Math.round(Number(avgQuality?.avg) || 0),
    },
    config: config ?? null,
  });
}
