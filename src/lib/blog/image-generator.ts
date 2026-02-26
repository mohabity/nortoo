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
 * Each category has a FUNDAMENTALLY different visual style, color palette,
 * and art direction — ensuring images never look alike across categories.
 */
const CATEGORY_STYLES: Record<
  string,
  { style: string; palette: string; elements: string }
> = {
  guide: {
    style:
      "Clean editorial photography, curated overhead flat-lay arrangement on a textured surface. Soft natural lighting with gentle shadows. Think Kinfolk magazine aesthetic.",
    palette:
      "warm amber, cream white, sage green, natural wood tones, matte terracotta",
    elements:
      "organized notebooks, precision tools, step-by-step diagrams drawn on paper, coffee cup, pencils, measurement instruments, sticky notes arranged in a system",
  },
  "case-study": {
    style:
      "Abstract data visualization rendered as fine art. Flowing geometric forms and mathematical curves transformed into a stunning landscape. Think Refik Anadol data sculptures.",
    palette:
      "deep ocean teal, burnished copper, midnight blue, subtle gold leaf accents, crystalline white",
    elements:
      "flowing data streams as rivers of light, growth curves as mountain ridges, network nodes as constellations, analytical shapes morphing into organic forms",
  },
  industry: {
    style:
      "Epic aerial cinematic shot with dramatic scale. Sweeping panoramic view combining commerce and geography. Think National Geographic meets Bloomberg Businessweek.",
    palette:
      "electric sapphire blue, chrome silver, warm sunrise orange and pink, deep space indigo",
    elements:
      "global shipping routes glowing on a dark ocean, container ships, cargo planes leaving trails, port cranes silhouetted against a dramatic sky, trade networks as light paths",
  },
  product: {
    style:
      "Ultra-premium product photography with floating elements. Clean minimalist showcase with impossible physics. Think Apple product launch visual.",
    palette:
      "clean white space, soft mint green accents, lavender mist, warm golden hour highlights, iridescent reflections",
    elements:
      "floating smartphone and laptop mockups, sleek dashboard interfaces with depth, glass-morphism UI panels, subtle particle effects, premium tech devices on invisible pedestals",
  },
  news: {
    style:
      "Dynamic abstract expressionism with kinetic energy. Bold graphic composition with movement and urgency. Think Bloomberg or Wired magazine cover illustration.",
    palette:
      "vibrant coral red, electric purple, hot magenta pink, golden yellow bursts, deep noir black",
    elements:
      "explosive energy bursts, speed lines and motion trails, breaking-through shattered glass effects, clock/time elements, bold geometric shapes in motion",
  },
};

/**
 * Extra compositional ideas shuffled randomly to add variety
 * even within the same category across multiple generations.
 */
const COMPOSITION_VARIATIONS = [
  "Use a dramatic diagonal composition with strong leading lines",
  "Center the main subject with a symmetrical, balanced layout",
  "Use the rule of thirds with the focal point in the upper right",
  "Create depth with foreground elements slightly blurred and background sharp",
  "Use a bird's-eye overhead perspective looking straight down",
  "Frame the scene with a shallow depth of field and beautiful bokeh",
  "Use a split composition with contrasting elements on each side",
  "Create a spiral or golden ratio composition flowing from corner to center",
];

/**
 * Builds a highly diverse prompt for GPT Image 1.
 * Each call produces a unique image because:
 * 1. Category determines fundamental art direction + palette
 * 2. Article title drives the actual subject matter
 * 3. Random composition variation adds layout diversity
 */
function buildPrompt(title: string, category: string): string {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.guide;
  const variation =
    COMPOSITION_VARIATIONS[
      Math.floor(Math.random() * COMPOSITION_VARIATIONS.length)
    ];

  return `Create a premium, visually stunning blog cover image.

ARTICLE TOPIC: "${title}"

ART DIRECTION: ${style.style}
COLOR PALETTE: ${style.palette}
VISUAL ELEMENTS: ${style.elements}
COMPOSITION: ${variation}

The image must VISUALLY TELL A STORY about "${title}" — not a generic abstract.
Interpret the topic creatively and create something unique that captures its essence.

QUALITY: This should look like it belongs in a premium tech/business publication.
High-end editorial quality with intentional lighting, careful composition, and rich detail.
Landscape format (wider than tall).

STRICT RULES:
- ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS anywhere in the image
- No human faces or realistic people
- No brand logos
- Maintain visual breathing room — premium, not cluttered`;
}

/**
 * Generates a cover image for a blog article using GPT Image 1,
 * uploads it to Vercel Blob (private store), and returns a proxy URL
 * that serves the image via `/api/blog/covers/[slug]`.
 */
export async function generateCoverImage(
  title: string,
  category: string,
  slug: string
): Promise<string> {
  const prompt = buildPrompt(title, category);

  // GPT Image 1: higher quality, more diverse, better prompt understanding
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (getOpenAI().images.generate as any)({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1536x1024",
    quality: "high",
  });

  // GPT Image 1 returns base64 directly (no expiring URL to download)
  const b64 = response.data?.[0]?.b64_json as string | undefined;
  if (!b64) {
    throw new Error("GPT Image 1 returned no image data");
  }

  const imageBuffer = Buffer.from(b64, "base64");

  // Upload to Vercel Blob (private store — served via proxy route)
  await put(`blog/covers/${slug}.png`, imageBuffer, {
    access: "private",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return `/api/blog/covers/${slug}`;
}
