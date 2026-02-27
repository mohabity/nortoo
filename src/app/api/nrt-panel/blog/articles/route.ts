import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const localeFilter = url.searchParams.get("locale");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage = 20;

  const conditions = [];
  if (statusFilter) conditions.push(eq(blogArticles.status, statusFilter));
  if (localeFilter) conditions.push(eq(blogArticles.locale, localeFilter));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [articles, [totalResult]] = await Promise.all([
    db
      .select({
        id: blogArticles.id,
        slug: blogArticles.slug,
        locale: blogArticles.locale,
        title: blogArticles.title,
        category: blogArticles.category,
        status: blogArticles.status,
        qualityScore: blogArticles.qualityScore,
        wordCount: blogArticles.wordCount,
        readingTime: blogArticles.readingTime,
        publishedAt: blogArticles.publishedAt,
        createdAt: blogArticles.createdAt,
      })
      .from(blogArticles)
      .where(whereClause)
      .orderBy(desc(blogArticles.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db
      .select({ cnt: count() })
      .from(blogArticles)
      .where(whereClause),
  ]);

  return NextResponse.json({
    data: articles,
    meta: {
      page,
      perPage,
      total: totalResult?.cnt ?? 0,
      totalPages: Math.ceil((totalResult?.cnt ?? 0) / perPage),
    },
  });
}
