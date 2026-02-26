import { db } from "@/db/index";
import { blogArticles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { escapeXml } from "@/lib/blog/seo";

export async function GET() {
  const articles = await db
    .select({
      slug: blogArticles.slug,
      locale: blogArticles.locale,
      updatedAt: blogArticles.updatedAt,
      publishedAt: blogArticles.publishedAt,
      translationOfId: blogArticles.translationOfId,
    })
    .from(blogArticles)
    .where(eq(blogArticles.status, "published"))
    .orderBy(desc(blogArticles.publishedAt));

  const baseUrl = "https://nortoo.ma";

  const urls = articles
    .map((a) => {
      const loc = `${baseUrl}/blog/${a.slug}`;
      const lastmod = (a.updatedAt ?? a.publishedAt)?.toISOString().split("T")[0];

      // Find translation
      let altLinks = "";
      if (a.locale === "fr") {
        altLinks += `\n    <xhtml:link rel="alternate" hreflang="fr" href="${loc}" />`;
        const enVersion = articles.find((t) => t.slug === `${a.slug}-en`);
        if (enVersion) {
          altLinks += `\n    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/blog/${enVersion.slug}" />`;
        }
        altLinks += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`;
      } else if (a.locale === "en" && a.translationOfId) {
        const frVersion = articles.find(
          (t) => t.locale === "fr" && a.slug === `${t.slug}-en`
        );
        if (frVersion) {
          altLinks += `\n    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/blog/${frVersion.slug}" />`;
        }
        altLinks += `\n    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />`;
      }

      return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${altLinks}
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
