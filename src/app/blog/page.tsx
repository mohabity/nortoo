import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { and, eq, desc, count, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { ArticleCard } from "@/components/blog/article-card";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/blog/seo";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — nortoo",
  description:
    "Conseils, guides et analyses pour les marchands e-commerce COD au Maroc. Réduisez vos retours, optimisez vos livraisons.",
  openGraph: {
    title: "Blog — nortoo",
    description:
      "Conseils, guides et analyses pour les marchands e-commerce COD au Maroc.",
    url: "https://nortoo.ma/blog",
    type: "website",
  },
};

const ARTICLES_PER_PAGE = 12;
const ALL_CATEGORIES = ["guide", "case-study", "industry", "product", "news"];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; cat?: string; lang?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const catFilter = params.cat ?? null;

  // Language: ?lang= param > nortoo_lang cookie > default fr
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("nortoo_lang")?.value;
  const locale =
    params.lang === "en" || params.lang === "fr"
      ? params.lang
      : cookieLang === "en"
        ? "en"
        : "fr";

  // Build conditions
  const conditions = [
    eq(blogArticles.status, "published"),
    eq(blogArticles.locale, locale),
  ];
  if (catFilter && ALL_CATEGORIES.includes(catFilter)) {
    conditions.push(eq(blogArticles.category, catFilter));
  }

  const whereClause = and(...conditions);

  // Fetch articles
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
      .limit(ARTICLES_PER_PAGE)
      .offset((page - 1) * ARTICLES_PER_PAGE),
    db
      .select({ cnt: count() })
      .from(blogArticles)
      .where(whereClause),
  ]);

  const total = totalResult?.cnt ?? 0;
  const totalPages = Math.ceil(total / ARTICLES_PER_PAGE);

  // Get category counts for filters
  const categoryCounts = await db
    .select({
      category: blogArticles.category,
      cnt: count(),
    })
    .from(blogArticles)
    .where(
      and(eq(blogArticles.status, "published"), eq(blogArticles.locale, locale))
    )
    .groupBy(blogArticles.category);

  const catCountMap = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c.cnt])
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-midnight">
          {locale === "en" ? "Blog" : "Blog"}
        </h1>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">
          {locale === "en"
            ? "Tips, guides and insights for COD e-commerce merchants in Morocco."
            : "Conseils, guides et analyses pour les marchands e-commerce COD au Maroc."}
        </p>

      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        <Link
          href="/blog"
          className={`text-xs px-4 py-2 rounded-full border transition-colors ${
            !catFilter
              ? "bg-mint/10 border-mint/30 text-mint-dark font-semibold"
              : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
        >
          {locale === "en" ? "All" : "Tout"} ({total})
        </Link>
        {ALL_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/blog?cat=${cat}`}
            className={`text-xs px-4 py-2 rounded-full border transition-colors ${
              catFilter === cat
                ? "bg-mint/10 border-mint/30 text-mint-dark font-semibold"
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            {getCategoryLabel(cat, locale)} ({catCountMap[cat] ?? 0})
          </Link>
        ))}
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
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">
            {locale === "en"
              ? "No articles yet. Check back soon!"
              : "Aucun article pour le moment. Revenez bientôt !"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          {page > 1 && (
            <Link
              href={`/blog?${catFilter ? `cat=${catFilter}&` : ""}page=${page - 1}`}
              className="text-sm px-4 py-2 border border-gray-200 rounded-sm text-gray-500 hover:text-midnight hover:border-gray-400 transition-colors"
            >
              ← {locale === "en" ? "Previous" : "Précédent"}
            </Link>
          )}
          <span className="text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?${catFilter ? `cat=${catFilter}&` : ""}page=${page + 1}`}
              className="text-sm px-4 py-2 border border-gray-200 rounded-sm text-gray-500 hover:text-midnight hover:border-gray-400 transition-colors"
            >
              {locale === "en" ? "Next" : "Suivant"} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
