import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { and, eq, desc, count } from "drizzle-orm";
import { cookies } from "next/headers";
import { ArticleCard } from "@/components/blog/article-card";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/blog/seo";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

const ALL_CATEGORIES = ["guide", "case-study", "industry", "product", "news"];

export async function generateStaticParams() {
  return ALL_CATEGORIES.map((cat) => ({ cat }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ cat: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { cat } = await params;
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("nortoo_lang")?.value;
  const locale =
    sp.lang === "en" || sp.lang === "fr"
      ? sp.lang
      : cookieLang === "en"
        ? "en"
        : "fr";
  const label = getCategoryLabel(cat, locale);
  return {
    title: `${label} — Blog nortoo`,
    description:
      locale === "en"
        ? `${label} articles for COD e-commerce merchants in Morocco.`
        : `Articles ${label.toLowerCase()} pour les marchands e-commerce COD au Maroc.`,
  };
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ cat: string }>;
  searchParams: Promise<{ page?: string; lang?: string }>;
}) {
  const { cat } = await params;
  const sp = await searchParams;

  // Language: ?lang= param > nortoo_lang cookie > default fr
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("nortoo_lang")?.value;
  const locale =
    sp.lang === "en" || sp.lang === "fr"
      ? sp.lang
      : cookieLang === "en"
        ? "en"
        : "fr";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const perPage = 12;

  const whereClause = and(
    eq(blogArticles.status, "published"),
    eq(blogArticles.locale, locale),
    eq(blogArticles.category, cat)
  );

  const [articles, [totalResult]] = await Promise.all([
    db
      .select({
        slug: blogArticles.slug,
        title: blogArticles.title,
        excerpt: blogArticles.excerpt,
        category: blogArticles.category,
        readingTime: blogArticles.readingTime,
        publishedAt: blogArticles.publishedAt,
        coverImageUrl: blogArticles.coverImageUrl,
        locale: blogArticles.locale,
      })
      .from(blogArticles)
      .where(whereClause)
      .orderBy(desc(blogArticles.publishedAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ cnt: count() }).from(blogArticles).where(whereClause),
  ]);

  const total = totalResult?.cnt ?? 0;
  const totalPages = Math.ceil(total / perPage);
  const label = getCategoryLabel(cat, locale);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/blog"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-mint transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {locale === "en" ? "All articles" : "Tous les articles"}
        </Link>
        <h1 className="text-3xl font-display font-bold text-midnight">
          {label}
        </h1>
        <p className="text-gray-500 mt-2">
          {total} {locale === "en" ? "articles" : "articles"}
        </p>
      </div>

      {/* Articles grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.slug}
              slug={article.slug}
              title={article.title}
              excerpt={article.excerpt}
              category={article.category}
              readingTime={article.readingTime}
              publishedAt={article.publishedAt}
              locale={article.locale}
              coverImageUrl={article.coverImageUrl}
            />
          ))}
        </div>
      ) : (
        <p className="text-center py-20 text-gray-400">
          {locale === "en" ? "No articles in this category yet." : "Aucun article dans cette catégorie."}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          {page > 1 && (
            <Link
              href={`/blog/categorie/${cat}?page=${page - 1}`}
              className="text-sm px-4 py-2 border border-gray-200 rounded-sm text-gray-500 hover:text-midnight transition-colors"
            >
              ←
            </Link>
          )}
          <span className="text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog/categorie/${cat}?page=${page + 1}`}
              className="text-sm px-4 py-2 border border-gray-200 rounded-sm text-gray-500 hover:text-midnight transition-colors"
            >
              →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
