import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog/"],
        disallow: ["/dashboard/", "/nrt-panel/", "/api/"],
      },
    ],
    sitemap: "https://nortoo.ma/blog/sitemap.xml",
  };
}
