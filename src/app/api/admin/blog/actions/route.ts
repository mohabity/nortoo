import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles, blogConfig, blogTopics } from "@/db/schema";
import { eq, like, or, isNull, asc } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { generateCoverImage } from "@/lib/blog/image-generator";
import { generateArticle } from "@/lib/blog/generator";
import { validateArticle } from "@/lib/blog/quality-check";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const maxDuration = 120;

const actionSchema = z.object({
  action: z.enum(["pause", "resume", "generate-now", "retry-failed", "replenish-topics", "regenerate-covers", "generate-custom"]),
  force: z.boolean().optional(),
  // Custom generation fields
  customTopic: z.string().min(1).optional(),
  customDescription: z.string().optional(),
  customCategory: z.enum(["guide", "case-study", "industry", "product", "news"]).optional(),
  customKeywords: z.array(z.string()).optional(),
  customWordCount: z.number().min(500).max(5000).optional(),
});

/** Derive the base URL from the incoming request origin */
function getBaseUrl(request: Request): string {
  // 1. Use the explicit app URL if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // 2. Derive from the incoming request
  try {
    const url = new URL(request.url);
    return url.origin;
  } catch {
    // 3. Fallback to VERCEL_URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return "http://localhost:3000";
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  }

  const { action } = parsed.data;

  switch (action) {
    case "pause": {
      await db
        .update(blogConfig)
        .set({ paused: true, updatedAt: new Date() })
        .where(eq(blogConfig.id, 1));
      return NextResponse.json({ success: true, action: "paused" });
    }

    case "resume": {
      await db
        .update(blogConfig)
        .set({ paused: false, pausedUntil: null, updatedAt: new Date() })
        .where(eq(blogConfig.id, 1));
      return NextResponse.json({ success: true, action: "resumed" });
    }

    case "generate-now": {
      const baseUrl = getBaseUrl(request);
      const secret = process.env.CRON_SECRET;

      try {
        const res = await fetch(`${baseUrl}/api/cron/blog-generate`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        const result = await res.json();
        return NextResponse.json({ success: true, action: "generate-now", result });
      } catch (err) {
        console.error("[admin/blog/actions] generate-now fetch error:", err);
        return NextResponse.json(
          { error: "Failed to trigger generation", details: String(err) },
          { status: 500 }
        );
      }
    }

    case "retry-failed": {
      await db
        .update(blogTopics)
        .set({ status: "queued", attempts: 0, errorMessage: null })
        .where(eq(blogTopics.status, "failed"));
      return NextResponse.json({ success: true, action: "retry-failed" });
    }

    case "replenish-topics": {
      const baseUrl = getBaseUrl(request);
      const secret = process.env.CRON_SECRET;

      try {
        const res = await fetch(`${baseUrl}/api/cron/blog-topics`, {
          headers: { Authorization: `Bearer ${secret}` },
        });
        const result = await res.json();
        return NextResponse.json({ success: true, action: "replenish-topics", result });
      } catch (err) {
        console.error("[admin/blog/actions] replenish-topics fetch error:", err);
        return NextResponse.json(
          { error: "Failed to trigger topic generation", details: String(err) },
          { status: 500 }
        );
      }
    }

    case "regenerate-covers": {
      // Find articles needing cover regeneration
      // force=true: regenerate ALL articles; default: only OG fallback articles
      const coverQuery = db
        .select({
          id: blogArticles.id,
          title: blogArticles.title,
          slug: blogArticles.slug,
          category: blogArticles.category,
          coverImageUrl: blogArticles.coverImageUrl,
          locale: blogArticles.locale,
        })
        .from(blogArticles);

      const articles = parsed.data.force
        ? await coverQuery.orderBy(asc(blogArticles.updatedAt))
        : await coverQuery
            .where(
              or(
                isNull(blogArticles.coverImageUrl),
                like(blogArticles.coverImageUrl, "%/api/og/blog%")
              )
            )
            .orderBy(asc(blogArticles.updatedAt));

      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY not configured" },
          { status: 500 }
        );
      }

      const results: { id: number; slug: string; status: string; url?: string }[] = [];

      // Only generate for FR articles (EN articles reuse FR cover)
      const frArticles = articles.filter((a) => a.locale === "fr");

      // Process ONE article per call to avoid timeout (DALL-E ~15-30s per image)
      const article = frArticles[0];
      if (article) {
        try {
          const newUrl = await generateCoverImage(
            article.title,
            article.category,
            article.slug
          );

          // Update FR article
          await db
            .update(blogArticles)
            .set({ coverImageUrl: newUrl, updatedAt: new Date() })
            .where(eq(blogArticles.id, article.id));

          // Update EN translations that share this FR article's cover
          const enVersions = articles.filter(
            (a) => a.locale === "en" && a.slug === `${article.slug}-en`
          );
          for (const en of enVersions) {
            await db
              .update(blogArticles)
              .set({ coverImageUrl: newUrl, updatedAt: new Date() })
              .where(eq(blogArticles.id, en.id));
          }

          results.push({ id: article.id, slug: article.slug, status: "ok", url: newUrl });
        } catch (err) {
          results.push({
            id: article.id,
            slug: article.slug,
            status: `error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      return NextResponse.json({
        success: true,
        action: "regenerate-covers",
        total: frArticles.length,
        remaining: frArticles.length - 1,
        results,
      });
    }

    case "generate-custom": {
      const topic = parsed.data.customTopic;
      if (!topic) {
        return NextResponse.json(
          { error: "customTopic is required for generate-custom" },
          { status: 400 }
        );
      }

      const category = parsed.data.customCategory ?? "guide";
      const keywords = parsed.data.customKeywords ?? [];
      const wordCount = parsed.data.customWordCount ?? 1500;

      try {
        // 1. Generate article via Claude
        const article = await generateArticle({
          topic,
          description: parsed.data.customDescription ?? null,
          category,
          targetKeywords: keywords,
          tone: "expert-accessible",
          targetWordCount: wordCount,
          locale: "fr",
        });

        // 2. Quality check
        const quality = validateArticle(article);

        // 3. Generate cover image (non-blocking fallback to OG)
        let coverImageUrl = `/api/og/blog?title=${encodeURIComponent(article.title)}&cat=${category}`;
        try {
          if (process.env.OPENAI_API_KEY) {
            coverImageUrl = await generateCoverImage(
              article.title,
              category,
              article.slug
            );
          }
        } catch (imgErr) {
          console.warn("[generate-custom] Cover image failed, using OG fallback:", imgErr);
        }

        // 4. Create a tracking topic
        const [newTopic] = await db
          .insert(blogTopics)
          .values({
            title: topic,
            description: parsed.data.customDescription ?? null,
            category,
            targetKeywords: JSON.stringify(keywords),
            tone: "expert-accessible",
            targetWordCount: wordCount,
            status: "published",
            priority: 0,
            attempts: 1,
            processedAt: new Date(),
          })
          .returning({ id: blogTopics.id });

        // 5. Insert article
        const pubDate = new Date();
        const [newArticle] = await db
          .insert(blogArticles)
          .values({
            slug: article.slug,
            locale: "fr",
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category,
            tags: JSON.stringify(article.tags),
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription,
            canonicalUrl: `https://nortoo.ma/blog/${article.slug}`,
            coverImageUrl,
            coverImageAlt: article.title,
            readingTime: article.readingTime,
            wordCount: article.wordCount,
            qualityScore: quality.score,
            status: quality.pass ? "published" : "failed",
            topicId: newTopic.id,
            generatedAt: pubDate,
            publishedAt: quality.pass ? pubDate : null,
            updatedAt: pubDate,
          })
          .returning({ id: blogArticles.id });

        // 6. Update topic with article reference
        await db
          .update(blogTopics)
          .set({ articleId: newArticle.id })
          .where(eq(blogTopics.id, newTopic.id));

        // 7. Revalidate ISR
        revalidatePath("/blog");
        revalidatePath(`/blog/${article.slug}`);

        return NextResponse.json({
          success: true,
          action: "generate-custom",
          article: {
            id: newArticle.id,
            title: article.title,
            slug: article.slug,
            qualityScore: quality.score,
            qualityPass: quality.pass,
            wordCount: article.wordCount,
          },
        });
      } catch (err) {
        console.error("[generate-custom] Error:", err);
        return NextResponse.json(
          { error: "Custom generation failed", details: err instanceof Error ? err.message : String(err) },
          { status: 500 }
        );
      }
    }
  }
}
