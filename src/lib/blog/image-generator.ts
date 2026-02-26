import OpenAI from "openai";
import { put } from "@vercel/blob";

/** Lazy-initialized OpenAI client (avoids build-time crash when env var is missing) */
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return _openai;
}

/**
 * Category-specific visual motifs for cinematic cover images
 */
const CATEGORY_THEMES: Record<string, string> = {
  guide:
    "glowing holographic checklist floating in space, translucent data panels, soft teal and emerald light trails",
  "case-study":
    "floating 3D bar charts with glass material, magnifying glass refracting light, connected data nodes glowing purple",
  industry:
    "rotating holographic globe with trade route lines, futuristic city skyline silhouette, indigo and blue volumetric light",
  product:
    "sleek product showcase on reflective surface, floating UI elements, warm amber and orange rim lighting",
  news:
    "dynamic burst of light particles, notification bell with glow effect, rose and magenta volumetric fog",
};

/**
 * Builds the DALL-E 3 prompt for a blog cover image.
 *
 * Style: cinematic 3D render, moody lighting, professional.
 * Consistent nortoo brand: dark backgrounds, mint/teal accents.
 * NO text, NO letters, NO words in the image.
 */
function buildPrompt(title: string, category: string): string {
  const theme = CATEGORY_THEMES[category] ?? CATEGORY_THEMES.guide;

  return `Create a cinematic, photorealistic 3D render for a professional blog article hero image.

TOPIC: "${title}"

STYLE REQUIREMENTS:
- Cinematic 3D render with dramatic lighting, NOT flat, NOT cartoonish, NOT vector art
- Dark moody atmosphere — deep navy/black background (#080C16) with volumetric lighting
- Primary accent light: mint/cyan (#00E5A0) as rim light, glow, or accent illumination
- Depth of field with bokeh — foreground sharp, background softly blurred
- Photorealistic materials: glass, metal, frosted surfaces, reflective planes
- Dramatic studio-quality lighting with soft shadows and caustics
- Professional feel like Apple or Stripe marketing imagery
- Abstract and conceptual — evoke the topic without being too literal

VISUAL COMPOSITION:
- ${theme}
- Include subtle e-commerce elements: a delivery package, smartphone, or shopping interface rendered as sleek 3D objects
- Moroccan-inspired geometric patterns as subtle etched details on glass/metal surfaces
- Floating holographic data elements: small charts, shield icons, score indicators with soft glow
- Particles, light rays, or subtle lens flare for cinematic depth

CRITICAL RULES:
- ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS anywhere in the image
- No human faces or realistic people — only objects and abstract forms
- No brand logos
- Ultra-clean, premium aesthetic — this is for a fintech/SaaS blog
- Wide format composition (landscape 16:9 ratio)
- Rich detail but not cluttered — leave visual breathing room`;
}

/**
 * Generates a cover image for a blog article using DALL-E 3,
 * uploads it to Vercel Blob (private store), and returns a proxy URL
 * that serves the image via `/api/blog/covers/[slug]`.
 */
export async function generateCoverImage(
  title: string,
  category: string,
  slug: string
): Promise<string> {
  // 1. Generate image with DALL-E 3
  const prompt = buildPrompt(title, category);

  const response = await getOpenAI().images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1792x1024", // Closest to 16:9 in DALL-E 3
    quality: "standard", // Fast generation (~15s vs ~60s for HD)
    style: "vivid",
  });

  const tempUrl = response.data?.[0]?.url;
  if (!tempUrl) {
    throw new Error("DALL-E 3 returned no image URL");
  }

  // 2. Download the image (DALL-E URLs expire after ~1h)
  const imageResponse = await fetch(tempUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download DALL-E image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();

  // 3. Upload to Vercel Blob (private store — served via proxy route)
  await put(`blog/covers/${slug}.png`, imageBuffer, {
    access: "private",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  // 4. Return proxy URL — the actual image is served via /api/blog/covers/[slug]
  return `/api/blog/covers/${slug}`;
}
