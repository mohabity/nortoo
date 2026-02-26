import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import readingTimeFn from "reading-time";

// Allow standard blog HTML (tables, iframes for embeds) but block scripts/event handlers
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "iframe"],
  attributes: {
    ...defaultSchema.attributes,
    iframe: ["src", "width", "height", "frameBorder", "allow", "allowFullScreen"],
  },
};

export async function renderMarkdown(content: string): Promise<string> {
  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings)
      .use(rehypeSanitize, sanitizeSchema)
      .use(rehypeStringify)
      .process(content);
    return String(result);
  } catch (err) {
    console.error("[renderMarkdown] Failed to render markdown:", err);
    return `<div class="prose"><p>${content.slice(0, 500)}…</p><p><em>Erreur de rendu du contenu.</em></p></div>`;
  }
}

export function getReadingTime(content: string): number {
  return Math.max(1, Math.round(readingTimeFn(content).minutes));
}

export function getWordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export function extractHeadings(content: string): Heading[] {
  const regex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9àâéèêëïîôùûüÿçœæ\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/^-|-$/g, "");
    headings.push({ level: match[1].length, text, id });
  }
  return headings;
}
