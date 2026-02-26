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
import Link from "next/link";
import { Clock, Calendar, ArrowLeft, Share2 } from "lucide-react";
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
    // This is EN, find FR original
    const [original] = await db
      .select({ slug: blogArticles.slug })
      .from(blogArticles)
      .where(eq(blogArticles.id, article.translationOfId))
      .limit(1);
    translationSlug = original?.slug ?? null;
  } else {
    // This is FR, find EN translation
    const [translation] = await db
      .select({ slug: blogArticles.slug, id: blogArticles.id })
      .from(blogArticles)
      .where(
        and(
          eq(blogArticles.locale, "en"),
          eq(blogArticles.status, "published")
        )
      );
    // Find by checking translationOfId matching this article's position
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

const CATEGORY_COLORS: Record<string, string> = {
  guide: "bg-mint/10 text-mint-dark",
  "case-study": "bg-violet/10 text-violet",
  industry: "bg-ocean/10 text-ocean",
  product: "bg-amber/10 text-amber",
  news: "bg-rose/10 text-rose",
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

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link href="/blog" className="hover:text-mint transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Blog
          </Link>
          <span>/</span>
          <Link
            href={`/blog?cat=${article.category}&lang=${article.locale}`}
            className="hover:text-mint transition-colors"
          >
            {getCategoryLabel(article.category, article.locale)}
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4 ${
              CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {getCategoryLabel(article.category, article.locale)}
          </span>

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-midnight leading-tight mb-4">
            {article.title}
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-6">
            {article.excerpt}
          </p>

          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-400">
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
                className="flex items-center gap-1 text-mint hover:text-mint-dark transition-colors font-medium"
              >
                {translationLocale === "en" ? "🇬🇧 English" : "🇫🇷 Français"}
              </Link>
            )}
          </div>
        </header>

        <div className="flex gap-10">
          {/* Table of Contents (desktop sidebar) */}
          {headings.length > 2 && (
            <aside className="hidden xl:block w-56 shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {article.locale === "en" ? "Contents" : "Sommaire"}
                </p>
                <nav className="space-y-2">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block text-xs text-gray-400 hover:text-mint transition-colors ${
                        h.level === 3 ? "pl-3" : ""
                      }`}
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
              prose-headings:font-display prose-headings:text-midnight
              prose-a:text-mint prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-mint prose-blockquote:bg-mint/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-sm
              prose-code:text-mint-dark prose-code:bg-mint/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-table:text-sm
              prose-th:bg-gray-50 prose-th:font-semibold
              prose-td:border-gray-200
              flex-1 min-w-0"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Tags */}
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-200">
            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="flex items-center gap-3 mt-6">
          <Share2 className="w-4 h-4 text-gray-400" />
          <a
            href={`https://wa.me/?text=${encodeURIComponent(article.title + " https://nortoo.ma/blog/" + article.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-500 hover:text-green-600 hover:border-green-300 transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://nortoo.ma/blog/" + article.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            LinkedIn
          </a>
          <a
            href={`https://x.com/intent/tweet?url=${encodeURIComponent("https://nortoo.ma/blog/" + article.slug)}&text=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
          >
            𝕏
          </a>
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 bg-gradient-to-br from-midnight to-slate rounded-sm text-center">
          <h3 className="text-xl font-display font-bold text-white mb-2">
            {article.locale === "en"
              ? "Reduce your COD returns today"
              : "Réduisez vos retours COD dès aujourd'hui"}
          </h3>
          <p className="text-mist text-sm mb-4">
            {article.locale === "en"
              ? "nortoo scores every order 0-100 and tells you which ones to ship."
              : "nortoo score chaque commande 0-100 et vous dit lesquelles expédier."}
          </p>
          <a
            href="https://app.nortoo.ma/register"
            className="inline-block px-6 py-3 bg-mint text-midnight font-semibold text-sm rounded-sm hover:bg-mint-dark transition-colors"
          >
            {article.locale === "en" ? "Try free for 14 days" : "Essai gratuit 14 jours"}
          </a>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-display font-bold text-midnight mb-8">
              {article.locale === "en" ? "Related articles" : "Articles similaires"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
