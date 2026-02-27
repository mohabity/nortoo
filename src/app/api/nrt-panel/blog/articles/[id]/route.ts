import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles, blogTopics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import readingTimeFn from "reading-time";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = parseInt(id, 10);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const [article] = await db
    .select()
    .from(blogArticles)
    .where(eq(blogArticles.id, articleId))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: article });
}

const updateSchema = z.object({
  status: z
    .enum(["generating", "published", "failed", "archived"])
    .optional(),
  seoTitle: z.string().max(65).optional(),
  seoDescription: z.string().max(165).optional(),
  title: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z
    .enum(["guide", "case-study", "industry", "product", "news"])
    .optional(),
  tags: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = parseInt(id, 10);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.seoTitle) updateData.seoTitle = parsed.data.seoTitle;
  if (parsed.data.seoDescription)
    updateData.seoDescription = parsed.data.seoDescription;
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.excerpt) updateData.excerpt = parsed.data.excerpt;
  if (parsed.data.category) updateData.category = parsed.data.category;
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;

  // If content changed, recalculate wordCount + readingTime
  if (parsed.data.content) {
    updateData.content = parsed.data.content;
    const stats = readingTimeFn(parsed.data.content);
    updateData.wordCount = parsed.data.content
      .split(/\s+/)
      .filter(Boolean).length;
    updateData.readingTime = Math.max(1, Math.round(stats.minutes));
  }

  // Get article slug before update for revalidation
  const [existing] = await db
    .select({ slug: blogArticles.slug })
    .from(blogArticles)
    .where(eq(blogArticles.id, articleId))
    .limit(1);

  await db
    .update(blogArticles)
    .set(updateData)
    .where(eq(blogArticles.id, articleId));

  // Revalidate ISR cache
  revalidatePath("/blog");
  if (existing?.slug) {
    revalidatePath(`/blog/${existing.slug}`);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const articleId = parseInt(id, 10);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Load article to check locale and relationships
  const [article] = await db
    .select()
    .from(blogArticles)
    .where(eq(blogArticles.id, articleId))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const slugsToRevalidate: string[] = [article.slug];

  if (article.locale === "fr") {
    // FR article: also delete EN translations that reference this article
    const translations = await db
      .select({ id: blogArticles.id, slug: blogArticles.slug })
      .from(blogArticles)
      .where(eq(blogArticles.translationOfId, articleId));

    for (const t of translations) {
      slugsToRevalidate.push(t.slug);
      // Clean topic articleEnId reference
      if (article.topicId) {
        await db
          .update(blogTopics)
          .set({ articleEnId: null })
          .where(eq(blogTopics.id, article.topicId));
      }
      await db.delete(blogArticles).where(eq(blogArticles.id, t.id));
    }

    // Clean topic articleId reference
    if (article.topicId) {
      await db
        .update(blogTopics)
        .set({ articleId: null, status: "queued" })
        .where(eq(blogTopics.id, article.topicId));
    }
  } else if (article.locale === "en" && article.translationOfId) {
    // EN article: clear translatedAt on FR parent
    await db
      .update(blogArticles)
      .set({ translatedAt: null, updatedAt: new Date() })
      .where(eq(blogArticles.id, article.translationOfId));

    // Clean topic articleEnId reference
    if (article.topicId) {
      await db
        .update(blogTopics)
        .set({ articleEnId: null })
        .where(eq(blogTopics.id, article.topicId));
    }
  }

  // Delete the article itself
  await db.delete(blogArticles).where(eq(blogArticles.id, articleId));

  // Revalidate ISR
  revalidatePath("/blog");
  for (const slug of slugsToRevalidate) {
    revalidatePath(`/blog/${slug}`);
  }

  return NextResponse.json({ success: true });
}
