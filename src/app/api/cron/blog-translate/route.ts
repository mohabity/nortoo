import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles, blogTopics, blogConfig } from "@/db/schema";
import { and, eq, asc, isNull } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { translateArticle } from "@/lib/blog/translator";
import { validateArticle } from "@/lib/blog/quality-check";
import { revalidatePath } from "next/cache";

export const maxDuration = 120;

/**
 * GET /api/cron/blog-translate
 *
 * Runs daily at 10h UTC. Finds FR articles without EN translation
 * and translates them via Claude.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withCronMonitoring("blog-translate", async () => {
      // 1. Check config
      const [config] = await db.select().from(blogConfig).limit(1);

      if (config?.paused) {
        return { status: "paused" };
      }

      if (config && !config.autoTranslate) {
        return { status: "auto_translate_disabled" };
      }

      // 2. Find untranslated FR articles
      const [untranslated] = await db
        .select()
        .from(blogArticles)
        .where(
          and(
            eq(blogArticles.locale, "fr"),
            eq(blogArticles.status, "published"),
            isNull(blogArticles.translatedAt)
          )
        )
        .orderBy(asc(blogArticles.publishedAt))
        .limit(1);

      if (!untranslated) {
        return { status: "all_translated" };
      }

      // 3. Translate via Claude
      const translated = await translateArticle({
        title: untranslated.title,
        excerpt: untranslated.excerpt,
        content: untranslated.content,
        seoTitle: untranslated.seoTitle,
        seoDescription: untranslated.seoDescription,
        tags: untranslated.tags,
        category: untranslated.category,
      });

      // 4. Quality check on translation
      const quality = validateArticle({
        title: translated.title,
        slug: `${untranslated.slug}-en`,
        excerpt: translated.excerpt,
        content: translated.content,
        seoTitle: translated.seoTitle,
        seoDescription: translated.seoDescription,
        wordCount: translated.wordCount,
      });

      const now = new Date();
      const enSlug = `${untranslated.slug}-en`;

      // 5. Insert EN article (reuse FR cover image — same visual for both languages)
      const coverImageUrl =
        untranslated.coverImageUrl ||
        `/api/og/blog?title=${encodeURIComponent(translated.title)}&cat=${untranslated.category}`;

      const [enArticle] = await db
        .insert(blogArticles)
        .values({
          slug: enSlug,
          locale: "en",
          translationOfId: untranslated.id,
          title: translated.title,
          excerpt: translated.excerpt,
          content: translated.content,
          category: untranslated.category,
          tags: JSON.stringify(translated.tags),
          seoTitle: translated.seoTitle,
          seoDescription: translated.seoDescription,
          canonicalUrl: `https://nortoo.ma/blog/${enSlug}`,
          coverImageUrl,
          coverImageAlt: translated.title,
          readingTime: translated.readingTime,
          wordCount: translated.wordCount,
          qualityScore: quality.score,
          status: "published",
          topicId: untranslated.topicId,
          generatedAt: now,
          publishedAt: now,
          updatedAt: now,
        })
        .returning({ id: blogArticles.id });

      // 6. Mark FR article as translated
      await db
        .update(blogArticles)
        .set({ translatedAt: now, updatedAt: now })
        .where(eq(blogArticles.id, untranslated.id));

      // 7. Update topic with EN article id
      if (untranslated.topicId) {
        await db
          .update(blogTopics)
          .set({ articleEnId: enArticle.id })
          .where(eq(blogTopics.id, untranslated.topicId));
      }

      // 8. Revalidate
      revalidatePath("/blog");
      revalidatePath(`/blog/${enSlug}`);

      return {
        status: "translated",
        originalId: untranslated.id,
        translatedId: enArticle.id,
        slug: enSlug,
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[blog-translate] Error:", err);
    return NextResponse.json(
      { error: "Blog translation failed", details: String(err) },
      { status: 500 }
    );
  }
}
