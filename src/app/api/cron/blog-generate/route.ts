import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles, blogTopics, blogConfig } from "@/db/schema";
import { and, eq, desc, asc, count, gte, or, isNull, lte } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { generateArticle } from "@/lib/blog/generator";
import { validateArticle } from "@/lib/blog/quality-check";
import { generateCoverImage } from "@/lib/blog/image-generator";
import { revalidatePath } from "next/cache";

export const maxDuration = 120;

/**
 * GET /api/cron/blog-generate
 *
 * Runs daily at 8h UTC. Picks the next topic from the queue,
 * generates an article via Claude, validates quality, and publishes.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("blog-generate", async () => {
      // 1. Check if blog is paused
      const [config] = await db
        .select()
        .from(blogConfig)
        .limit(1);

      if (config?.paused) {
        if (config.pausedUntil && new Date(config.pausedUntil) > new Date()) {
          return { status: "paused", until: config.pausedUntil.toISOString() };
        }
        // Auto-unpause if date has passed
        await db
          .update(blogConfig)
          .set({ paused: false, pausedUntil: null })
          .where(eq(blogConfig.id, config.id));
      }

      // 2. Check weekly quota
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const weekStart = new Date(now);
      weekStart.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7)); // Monday
      weekStart.setUTCHours(0, 0, 0, 0);

      const [publishedThisWeek] = await db
        .select({ cnt: count() })
        .from(blogArticles)
        .where(
          and(
            eq(blogArticles.locale, "fr"),
            eq(blogArticles.status, "published"),
            gte(blogArticles.publishedAt, weekStart)
          )
        );

      const maxPerWeek = config?.articlesPerWeek ?? 3;
      if ((publishedThisWeek?.cnt ?? 0) >= maxPerWeek) {
        return {
          status: "quota_reached",
          published: publishedThisWeek?.cnt ?? 0,
          max: maxPerWeek,
        };
      }

      // 3. Pick next topic from queue
      const [topic] = await db
        .select()
        .from(blogTopics)
        .where(
          and(
            eq(blogTopics.status, "queued"),
            or(
              isNull(blogTopics.scheduledFor),
              lte(blogTopics.scheduledFor, now)
            )
          )
        )
        .orderBy(desc(blogTopics.priority), asc(blogTopics.createdAt))
        .limit(1);

      if (!topic) {
        return { status: "queue_empty" };
      }

      // 4. Mark topic as generating
      await db
        .update(blogTopics)
        .set({ status: "generating", attempts: topic.attempts + 1 })
        .where(eq(blogTopics.id, topic.id));

      try {
        // 5. Generate article via Claude
        const article = await generateArticle({
          topic: topic.title,
          description: topic.description,
          category: topic.category,
          targetKeywords: JSON.parse(topic.targetKeywords),
          tone: topic.tone ?? "expert-accessible",
          targetWordCount: topic.targetWordCount ?? 1500,
          locale: "fr",
        });

        // 6. Quality check
        const quality = validateArticle(article);
        if (!quality.pass) {
          throw new Error(
            `Quality check failed (score: ${quality.score}): ${quality.reasons.join(", ")}`
          );
        }

        // 7. Generate cover image via DALL-E 3 (non-blocking fallback to OG)
        let coverImageUrl = `/api/og/blog?title=${encodeURIComponent(article.title)}&cat=${topic.category}`;
        try {
          if (process.env.OPENAI_API_KEY) {
            console.log("[blog-generate] Generating DALL-E 3 cover image...");
            coverImageUrl = await generateCoverImage(
              article.title,
              topic.category,
              article.slug
            );
            console.log("[blog-generate] Cover image uploaded:", coverImageUrl);
          }
        } catch (imgErr) {
          console.warn("[blog-generate] Cover image generation failed, using OG fallback:", imgErr);
          // Keep the OG fallback URL — article still publishes
        }

        // 8. Insert article as published
        const pubDate = new Date();
        const [newArticle] = await db
          .insert(blogArticles)
          .values({
            slug: article.slug,
            locale: "fr",
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: topic.category,
            tags: JSON.stringify(article.tags),
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription,
            canonicalUrl: `https://nortoo.ma/blog/${article.slug}`,
            coverImageUrl,
            coverImageAlt: article.title,
            readingTime: article.readingTime,
            wordCount: article.wordCount,
            qualityScore: quality.score,
            status: "published",
            topicId: topic.id,
            generatedAt: pubDate,
            publishedAt: pubDate,
            updatedAt: pubDate,
          })
          .returning({ id: blogArticles.id });

        // 9. Update topic
        await db
          .update(blogTopics)
          .set({
            status: "published",
            articleId: newArticle.id,
            processedAt: pubDate,
          })
          .where(eq(blogTopics.id, topic.id));

        // 10. Revalidate ISR
        revalidatePath("/blog");
        revalidatePath(`/blog/${article.slug}`);

        return {
          status: "published",
          articleId: newArticle.id,
          slug: article.slug,
          title: article.title,
          wordCount: article.wordCount,
          qualityScore: quality.score,
        };
      } catch (error) {
        // Mark topic as failed or retry
        const newStatus = topic.attempts + 1 >= 3 ? "failed" : "queued";
        await db
          .update(blogTopics)
          .set({
            status: newStatus,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(blogTopics.id, topic.id));

        throw error;
      }
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[blog-generate] Error:", err);
    return NextResponse.json(
      { error: "Blog generation failed", details: String(err) },
      { status: 500 }
    );
  }
}
