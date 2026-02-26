import { get } from "@vercel/blob";
import { NextRequest } from "next/server";

/**
 * GET /api/blog/covers/[slug]
 *
 * Proxy route that serves DALL-E cover images stored in Vercel Blob (private store).
 * Images are cached at CDN level for 1 year (immutable).
 *
 * Blob pathname pattern: blog/covers/{slug}.png
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Sanitize slug — only allow alphanumeric, hyphens
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return new Response("Invalid slug", { status: 400 });
  }

  try {
    const result = await get(`blog/covers/${slug}.png`, {
      access: "private",
    });

    if (!result) {
      return new Response("Image not found", { status: 404 });
    }

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType ?? "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(`[blog-covers] Error serving ${slug}:`, error);
    return new Response("Image not available", { status: 404 });
  }
}
