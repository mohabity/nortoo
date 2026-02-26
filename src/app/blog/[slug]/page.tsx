import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { renderMarkdown, extractHeadings } from "@/lib/blog/markdown";
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  getCategoryLabel,
} from "@/lib/blog/seo";
import { ArticleCard } from "@/components/blog/article-card";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ArticleTracker } from "@/components/tracking/article-tracker";
import Link from "next/link";
import { Clock, Calendar, ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

// SSG
export async function generateStaticParams() {
  const articles = await db
    .select({ slug: blogArticles.slug })
    .from(blogArticles)
    .where(eq(blogArticles.status, "published"));

  return articles.map((a) => ({ slug: a.slug }));
}

// Dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article] = await db
    .select({
      title: blogArticles.title,
      seoTitle: blogArticles.seoTitle,
      seoDescription: blogArticles.seoDescription,
      slug: blogArticles.slug,
      locale: blogArticles.locale,
      coverImageUrl: blogArticles.coverImageUrl,
      publishedAt: blogArticles.publishedAt,
      category: blogArticles.category,
      tags: blogArticles.tags,
      translationOfId: blogArticles.translationOfId,
    })
    .from(blogArticles)
    .where(and(eq(blogArticles.slug, slug), eq(blogArticles.status, "published")))
    .limit(1);

  if (!article) return { title: "Article not found" };

  // Find translation
  let translationSlug: string | null = null;
  if (article.translationOfId) {
    const [original] = await db
      .select({ slug: blogArticles.slug })
      .from(blogArticles)
      .where(eq(blogArticles.id, article.translationOfId))
      .limit(1);
    translationSlug = original?.slug ?? null;
  } else {
    const allTranslations = await db
      .select({ slug: blogArticles.slug })
      .from(blogArticles)
      .where(eq(blogArticles.slug, `${slug}-en`))
      .limit(1);
    translationSlug = allTranslations[0]?.slug ?? null;
  }

  const baseUrl = "https://nortoo.ma";
  const alternateLanguages: Record<string, string> = {};
  if (article.locale === "fr") {
    alternateLanguages["fr"] = `${baseUrl}/blog/${slug}`;
    if (translationSlug) alternateLanguages["en"] = `${baseUrl}/blog/${translationSlug}`;
  } else {
    alternateLanguages["en"] = `${baseUrl}/blog/${slug}`;
    if (translationSlug) alternateLanguages["fr"] = `${baseUrl}/blog/${translationSlug}`;
  }

  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(article.tags);
  } catch {}

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: article.seoTitle,
      description: article.seoDescription,
      url: `${baseUrl}/blog/${slug}`,
      type: "article",
      locale: article.locale === "en" ? "en_US" : "fr_FR",
      images: article.coverImageUrl
        ? [{ url: `${baseUrl}${article.coverImageUrl}`, width: 1200, height: 630 }]
        : undefined,
      publishedTime: article.publishedAt?.toISOString(),
      section: article.category,
      tags: parsedTags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.seoDescription,
    },
  };
}

const CATEGORY_COLORS: Record<string, { badge: string; accent: string }> = {
  guide: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accent: "from-emerald-600 to-teal-700",
  },
  "case-study": {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    accent: "from-violet-600 to-purple-700",
  },
  industry: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    accent: "from-blue-600 to-indigo-700",
  },
  product: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "from-amber-500 to-orange-600",
  },
  news: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    accent: "from-rose-500 to-pink-600",
  },
};

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [article] = await db
    .select()
    .from(blogArticles)
    .where(and(eq(blogArticles.slug, slug), eq(blogArticles.status, "published")))
    .limit(1);

  if (!article) notFound();

  // Render markdown
  const htmlContent = await renderMarkdown(article.content);
  const headings = extractHeadings(article.content);

  // Find translation link
  let translationSlug: string | null = null;
  let translationLocale: string | null = null;
  if (article.translationOfId) {
    const [original] = await db
      .select({ slug: blogArticles.slug })
      .from(blogArticles)
      .where(eq(blogArticles.id, article.translationOfId))
      .limit(1);
    translationSlug = original?.slug ?? null;
    translationLocale = "fr";
  } else {
    const [translation] = await db
      .select({ slug: blogArticles.slug })
      .from(blogArticles)
      .where(eq(blogArticles.slug, `${slug}-en`))
      .limit(1);
    translationSlug = translation?.slug ?? null;
    translationLocale = "en";
  }

  // Related articles (same category, same locale, different article)
  const related = await db
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
    .where(
      and(
        eq(blogArticles.status, "published"),
        eq(blogArticles.locale, article.locale),
        eq(blogArticles.category, article.category),
        ne(blogArticles.slug, slug)
      )
    )
    .orderBy(desc(blogArticles.publishedAt))
    .limit(3);

  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(article.tags);
  } catch {}

  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        article.locale === "en" ? "en-US" : "fr-FR",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : "";

  const seoData = {
    title: article.title,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    slug: article.slug,
    locale: article.locale,
    category: article.category,
    tags: article.tags,
    coverImageUrl: article.coverImageUrl,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    wordCount: article.wordCount,
    excerpt: article.excerpt,
  };

  const colors = CATEGORY_COLORS[article.category] ?? {
    badge: "bg-gray-50 text-gray-600 border-gray-200",
    accent: "from-gray-600 to-gray-700",
  };

  // Use the stored cover image URL, or fall back to the OG endpoint
  const coverImage =
    article.coverImageUrl ||
    `/api/og/blog?title=${encodeURIComponent(article.title)}&cat=${encodeURIComponent(article.category)}`;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateArticleJsonLd(seoData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateBreadcrumbJsonLd(seoData),
        }}
      />

      <article className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#94A3B8] py-6">
          <Link href="/blog" className="hover:text-[#00C78A] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Blog
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={`/blog?cat=${article.category}`}
            className="hover:text-[#00C78A] transition-colors"
          >
            {getCategoryLabel(article.category, article.locale)}
          </Link>
        </nav>

        {/* Cover image */}
        <div className={`w-full aspect-[2.4/1] rounded-2xl overflow-hidden mb-10 bg-gradient-to-br ${colors.accent}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article hero header */}
        <header className="max-w-3xl mb-10">
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border mb-5 ${colors.badge}`}
          >
            {getCategoryLabel(article.category, article.locale)}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-[#0B0F1A] leading-[1.15] mb-5">
            {article.title}
          </h1>

          <p className="text-lg text-[#64748B] leading-relaxed mb-6">
            {article.excerpt}
          </p>

          <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-sm text-[#94A3B8]">
            {dateStr && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {dateStr}
              </span>
            )}
            {article.readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {article.readingTime} min {article.locale === "en" ? "read" : "de lecture"}
              </span>
            )}
            {translationSlug && (
              <Link
                href={`/blog/${translationSlug}`}
                className="flex items-center gap-1.5 text-[#00C78A] hover:text-[#00A674] transition-colors font-medium"
              >
                {translationLocale === "en" ? "🇬🇧 Read in English" : "🇫🇷 Lire en français"}
              </Link>
            )}
          </div>
        </header>

        {/* Content area: sidebar + article */}
        <div className="flex gap-12 pb-10">
          {/* Table of Contents (desktop sidebar) */}
          {headings.length > 2 && (
            <aside className="hidden xl:block w-56 shrink-0">
              <div className="sticky top-24">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">
                  {article.locale === "en" ? "Contents" : "Sommaire"}
                </p>
                <nav className="space-y-1 border-l-2 border-[#F1F5F9]">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block text-xs text-[#94A3B8] hover:text-[#0B0F1A] transition-colors py-1 ${
                        h.level === 3 ? "pl-6" : "pl-4"
                      } border-l-2 -ml-[2px] border-transparent hover:border-[#00E5A0]`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Article content */}
          <div
            className="prose prose-lg prose-gray max-w-none
              prose-headings:font-display prose-headings:text-[#0B0F1A]
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-[#475569] prose-p:leading-relaxed
              prose-a:text-[#00C78A] prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-strong:text-[#0B0F1A]
              prose-blockquote:border-l-[#00E5A0] prose-blockquote:bg-[#F8FAFC] prose-blockquote:py-1 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
              prose-code:text-[#0B0F1A] prose-code:bg-[#F1F5F9] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono
              prose-ul:text-[#475569] prose-ol:text-[#475569]
              prose-li:marker:text-[#00C78A]
              prose-table:text-sm
              prose-th:bg-[#F8FAFC] prose-th:font-semibold prose-th:text-[#0B0F1A]
              prose-td:border-[#E2E8F0]
              prose-img:rounded-xl
              flex-1 min-w-0"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Tags + Share */}
        <div className="border-t border-[#E2E8F0] pt-8 pb-6 max-w-3xl">
          {/* Tags */}
          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {parsedTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 bg-[#F8FAFC] text-[#64748B] rounded-full border border-[#E2E8F0]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Share */}
          <ShareButtons title={article.title} slug={article.slug} locale={article.locale} />
        </div>

        {/* Read completion tracker */}
        <ArticleTracker slug={article.slug} />

        {/* CTA */}
        <div className="my-10 p-8 md:p-10 bg-gradient-to-br from-[#0B0F1A] to-[#1E293B] rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-2">
                {article.locale === "en"
                  ? "Reduce your COD returns today"
                  : "Réduisez vos retours COD dès aujourd'hui"}
              </h3>
              <p className="text-[#94A3B8] text-sm max-w-md">
                {article.locale === "en"
                  ? "nortoo scores every order 0-100 and tells you which ones to ship."
                  : "nortoo score chaque commande 0-100 et vous dit lesquelles expédier."}
              </p>
            </div>
            <a
              href="https://app.nortoo.ma/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#00E5A0] text-[#0B0F1A] font-semibold text-sm rounded-xl hover:bg-[#00C78A] transition-colors shrink-0"
            >
              {article.locale === "en" ? "Try free for 14 days" : "Essai gratuit 14 jours"}
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="py-10">
            <h2 className="text-2xl font-display font-bold text-[#0B0F1A] mb-8">
              {article.locale === "en" ? "Related articles" : "Articles similaires"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r) => (
                <ArticleCard
                  key={r.slug}
                  slug={r.slug}
                  title={r.title}
                  excerpt={r.excerpt}
                  category={r.category}
                  readingTime={r.readingTime}
                  publishedAt={r.publishedAt}
                  locale={r.locale}
                  coverImageUrl={r.coverImageUrl}
                />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
