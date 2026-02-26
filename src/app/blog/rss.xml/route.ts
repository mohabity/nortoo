import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { escapeXml } from "@/lib/blog/seo";

export async function GET() {
  const articles = await db
    .select({
      title: blogArticles.title,
      slug: blogArticles.slug,
      excerpt: blogArticles.excerpt,
      category: blogArticles.category,
      publishedAt: blogArticles.publishedAt,
    })
    .from(blogArticles)
    .where(
      and(
        eq(blogArticles.status, "published"),
        eq(blogArticles.locale, "fr")
      )
    )
    .orderBy(desc(blogArticles.publishedAt))
    .limit(20);

  const baseUrl = "https://nortoo.ma";

  const items = articles
    .map(
      (a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${baseUrl}/blog/${a.slug}</link>
      <description>${escapeXml(a.excerpt)}</description>
      <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : ""}</pubDate>
      <guid isPermaLink="true">${baseUrl}/blog/${a.slug}</guid>
      <category>${escapeXml(a.category)}</category>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>nortoo Blog — E-commerce COD Maroc</title>
    <link>${baseUrl}/blog</link>
    <description>Guides, analyses et stratégies pour les marchands e-commerce COD au Maroc.</description>
    <language>fr</language>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
