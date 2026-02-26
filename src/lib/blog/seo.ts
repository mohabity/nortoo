export interface BlogArticleSEO {
  title: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  locale: string;
  category: string;
  tags: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  wordCount: number | null;
  excerpt: string;
}

const BASE_URL = "https://nortoo.ma";

export function generateArticleJsonLd(article: BlogArticleSEO): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle,
    description: article.seoDescription,
    image: article.coverImageUrl
      ? (article.coverImageUrl.startsWith("/") ? `${BASE_URL}${article.coverImageUrl}` : article.coverImageUrl)
      : `${BASE_URL}/api/og/blog?title=${encodeURIComponent(article.title)}&cat=${encodeURIComponent(article.category)}`,
    author: {
      "@type": "Organization",
      name: "nortoo",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "nortoo",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/nortoo-logo.png`,
      },
    },
    datePublished: article.publishedAt?.toISOString(),
    dateModified: (article.updatedAt ?? article.publishedAt)?.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${article.slug}`,
    },
    inLanguage: article.locale === "en" ? "en-US" : "fr-FR",
    wordCount: article.wordCount,
    articleSection: article.category,
  };

  return JSON.stringify(jsonLd);
}

export function generateBreadcrumbJsonLd(article: BlogArticleSEO): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "nortoo",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${BASE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${BASE_URL}/blog/${article.slug}`,
      },
    ],
  };

  return JSON.stringify(jsonLd);
}

export function getHreflangLinks(
  slug: string,
  locale: string,
  translationSlug: string | null
): { rel: string; hrefLang: string; href: string }[] {
  const links = [
    {
      rel: "alternate",
      hrefLang: locale === "fr" ? "fr" : "en",
      href: `${BASE_URL}/blog/${slug}`,
    },
  ];

  if (translationSlug) {
    links.push({
      rel: "alternate",
      hrefLang: locale === "fr" ? "en" : "fr",
      href: `${BASE_URL}/blog/${translationSlug}`,
    });
  }

  // x-default points to FR version
  const frSlug = locale === "fr" ? slug : translationSlug;
  if (frSlug) {
    links.push({
      rel: "alternate",
      hrefLang: "x-default",
      href: `${BASE_URL}/blog/${frSlug}`,
    });
  }

  return links;
}

export function getCategoryLabel(category: string, locale: string = "fr"): string {
  const labels: Record<string, { fr: string; en: string }> = {
    guide: { fr: "Guide", en: "Guide" },
    "case-study": { fr: "Étude de cas", en: "Case Study" },
    industry: { fr: "Industrie", en: "Industry" },
    product: { fr: "Produit", en: "Product" },
    news: { fr: "Actualités", en: "News" },
  };
  return labels[category]?.[locale as "fr" | "en"] ?? category;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
