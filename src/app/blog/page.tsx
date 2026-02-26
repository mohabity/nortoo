import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { and, eq, desc, count } from "drizzle-orm";
import { cookies } from "next/headers";
import { ArticleCard } from "@/components/blog/article-card";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/blog/seo";
import { BookOpen, Rss } from "lucide-react";
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

  // Total across all categories (for the "All" filter badge)
  const globalTotal = categoryCounts.reduce((sum, c) => sum + c.cnt, 0);

  // Split: first article is featured, rest in grid
  const featuredArticle = !catFilter && page === 1 ? articles[0] : null;
  const gridArticles = featuredArticle ? articles.slice(1) : articles;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Hero header */}
      <div className="py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#00C78A]" />
              </div>
              <span className="text-xs font-semibold text-[#00C78A] uppercase tracking-wider">
                Blog
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-[#0B0F1A] mb-2">
              {locale === "en"
                ? "Insights for COD merchants"
                : "Ressources pour marchands COD"}
            </h1>
            <p className="text-[#64748B] max-w-lg">
              {locale === "en"
                ? "Guides, case studies and tips to reduce your COD returns and grow your e-commerce in Morocco."
                : "Guides, études de cas et conseils pour réduire vos retours COD et développer votre e-commerce au Maroc."}
            </p>
          </div>
          <a
            href="/blog/rss.xml"
            className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#00C78A] transition-colors shrink-0"
          >
            <Rss className="w-3.5 h-3.5" />
            RSS
          </a>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-8 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <Link
          href="/blog"
          className={`shrink-0 text-xs px-4 py-2 rounded-full border transition-all ${
            !catFilter
              ? "bg-[#0B0F1A] border-[#0B0F1A] text-white font-semibold"
              : "border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0B0F1A]"
          }`}
        >
          {locale === "en" ? "All" : "Tout"} ({globalTotal})
        </Link>
        {ALL_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/blog?cat=${cat}`}
            className={`shrink-0 text-xs px-4 py-2 rounded-full border transition-all ${
              catFilter === cat
                ? "bg-[#0B0F1A] border-[#0B0F1A] text-white font-semibold"
                : "border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0B0F1A]"
            }`}
          >
            {getCategoryLabel(cat, locale)} ({catCountMap[cat] ?? 0})
          </Link>
        ))}
      </div>

      {/* Featured article */}
      {featuredArticle && (
        <div className="mb-8">
          <ArticleCard
            slug={featuredArticle.slug}
            title={featuredArticle.title}
            excerpt={featuredArticle.excerpt}
            category={featuredArticle.category}
            readingTime={featuredArticle.readingTime}
            publishedAt={featuredArticle.publishedAt}
            locale={featuredArticle.locale}
            coverImageUrl={featuredArticle.coverImageUrl}
            featured
          />
        </div>
      )}

      {/* Articles grid */}
      {gridArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridArticles.map((article) => (
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
      ) : !featuredArticle ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-[#CBD5E1]" />
          </div>
          <p className="text-[#64748B] font-medium mb-1">
            {locale === "en"
              ? "No articles yet"
              : "Aucun article pour le moment"}
          </p>
          <p className="text-sm text-[#94A3B8]">
            {locale === "en"
              ? "Check back soon — new content is published weekly."
              : "Revenez bientôt — du nouveau contenu est publié chaque semaine."}
          </p>
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-14 mb-8">
          {page > 1 && (
            <Link
              href={`/blog?${catFilter ? `cat=${catFilter}&` : ""}page=${page - 1}`}
              className="text-sm px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0B0F1A] hover:border-[#CBD5E1] transition-colors"
            >
              ← {locale === "en" ? "Previous" : "Précédent"}
            </Link>
          )}
          <span className="text-sm text-[#94A3B8] px-3">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/blog?${catFilter ? `cat=${catFilter}&` : ""}page=${page + 1}`}
              className="text-sm px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0B0F1A] hover:border-[#CBD5E1] transition-colors"
            >
              {locale === "en" ? "Next" : "Suivant"} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
