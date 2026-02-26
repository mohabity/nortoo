import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles, blogTopics, blogConfig } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { generateTopics } from "@/lib/blog/topic-engine";

export const maxDuration = 120;

/**
 * GET /api/cron/blog-topics
 *
 * Runs weekly (Monday 6h UTC). Refills the topic queue
 * if it drops below the configured threshold.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("blog-topics", async () => {
      // 1. Check queue size
      const [queueCount] = await db
        .select({ cnt: count() })
        .from(blogTopics)
        .where(eq(blogTopics.status, "queued"));

      const [config] = await db.select().from(blogConfig).limit(1);
      const minQueue = config?.minQueueSize ?? 10;

      if ((queueCount?.cnt ?? 0) >= minQueue) {
        return {
          status: "queue_sufficient",
          count: queueCount?.cnt ?? 0,
          threshold: minQueue,
        };
      }

      // 2. Load existing topics to avoid duplicates
      const existingTopics = await db
        .select({ title: blogTopics.title })
        .from(blogTopics);
      const existingTitles = existingTopics.map((t) => t.title);

      // 3. Load existing articles for context
      const existingArticles = await db
        .select({
          title: blogArticles.title,
          category: blogArticles.category,
        })
        .from(blogArticles)
        .where(eq(blogArticles.locale, "fr"));

      // 4. Generate new topics via Claude
      const toGenerate = minQueue - (queueCount?.cnt ?? 0);
      const newTopics = await generateTopics({
        count: toGenerate,
        existingTitles,
        existingArticles,
        categories: ["guide", "case-study", "industry", "product", "news"],
        targetAudience: "marchands e-commerce COD au Maroc",
        domain:
          "réduction RTO, scoring commandes, WhatsApp Business, logistique COD, e-commerce Maroc",
      });

      // 5. Insert new topics
      let inserted = 0;
      for (const topic of newTopics) {
        try {
          await db.insert(blogTopics).values({
            title: topic.title,
            description: topic.description,
            category: topic.category,
            targetKeywords: JSON.stringify(topic.keywords),
            tone: topic.tone ?? "expert-accessible",
            targetWordCount: topic.wordCount ?? 1500,
            priority: topic.priority ?? 0,
          });
          inserted++;
        } catch (err) {
          console.error(`[blog-topics] Failed to insert topic "${topic.title}":`, err);
        }
      }

      return {
        status: "topics_generated",
        inserted,
        queueTotal: (queueCount?.cnt ?? 0) + inserted,
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[blog-topics] Error:", err);
    return NextResponse.json(
      { error: "Topic generation failed", details: String(err) },
      { status: 500 }
    );
  }
}
