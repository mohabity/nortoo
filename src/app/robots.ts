import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/dashboard/", "/nrt-panel/", "/api/"],
      },
    ],
    sitemap: "https://nortoo.ma/sitemap.xml",
  };
}
