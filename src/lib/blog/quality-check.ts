export interface QualityResult {
  pass: boolean;
  score: number; // 0-100
  reasons: string[];
}

export function validateArticle(article: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  wordCount: number;
}): QualityResult {
  const reasons: string[] = [];
  let score = 100;

  // ── Title ──
  if (!article.title || article.title.length < 20) {
    reasons.push("Title too short (< 20 chars)");
    score -= 30;
  }
  if (article.title.length > 80) {
    reasons.push("Title too long (> 80 chars)");
    score -= 10;
  }

  // ── Slug ──
  if (!article.slug || !/^[a-z0-9-]+$/.test(article.slug)) {
    reasons.push("Invalid slug format");
    score -= 20;
  }

  // ── Excerpt ──
  if (!article.excerpt || article.excerpt.length < 100) {
    reasons.push("Excerpt too short (< 100 chars)");
    score -= 15;
  }
  if (article.excerpt.length > 170) {
    reasons.push("Excerpt too long (> 170 chars)");
    score -= 5;
  }

  // ── Content ──
  if (article.wordCount < 400) {
    reasons.push(`Word count too low: ${article.wordCount}`);
    score -= 40;
  }

  // Check for H2 headings
  const h2Count = (article.content.match(/^## /gm) || []).length;
  if (h2Count < 2) {
    reasons.push(`Too few H2 headings: ${h2Count}`);
    score -= 15;
  }

  // Check for placeholders
  const placeholders = ["[TODO]", "[INSERT]", "Lorem ipsum", "PLACEHOLDER"];
  for (const ph of placeholders) {
    if (article.content.includes(ph)) {
      reasons.push(`Contains placeholder: ${ph}`);
      score -= 30;
    }
  }

  // ── SEO ──
  if (!article.seoTitle || article.seoTitle.length > 65) {
    reasons.push("SEO title missing or > 65 chars");
    score -= 10;
  }
  if (!article.seoDescription || article.seoDescription.length > 165) {
    reasons.push("SEO description missing or > 165 chars");
    score -= 10;
  }

  // ── Content sanity (should not be JSON) ──
  if (article.content.trim().startsWith("{")) {
    reasons.push("Content appears to be JSON, not Markdown");
    score -= 50;
  }

  return {
    pass: score >= 60,
    score: Math.max(0, score),
    reasons,
  };
}
