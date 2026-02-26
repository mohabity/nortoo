import Anthropic from "@anthropic-ai/sdk";
import readingTimeFn from "reading-time";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface TranslateArticleInput {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  tags: string;
  category: string;
}

export interface TranslatedArticle {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  wordCount: number;
  readingTime: number;
}

export async function translateArticle(
  article: TranslateArticleInput
): Promise<TranslatedArticle> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: `Tu es un traducteur expert FR→EN spécialisé en e-commerce et marketing digital.
Traduis de manière naturelle, pas mot-à-mot. Adapte les expressions au marché anglophone tout en gardant le contexte marocain.
Les termes techniques (COD, RTO, scoring) restent en anglais.
Les montants en DH restent en DH avec l'équivalent USD entre parenthèses si > 1000 DH.
Réponds UNIQUEMENT en JSON valide avec les mêmes clés que l'input.`,
    messages: [
      {
        role: "user",
        content: `Traduis cet article du français vers l'anglais. Réponds en JSON valide uniquement.

{
  "title": ${JSON.stringify(article.title)},
  "excerpt": ${JSON.stringify(article.excerpt)},
  "content": ${JSON.stringify(article.content)},
  "seoTitle": ${JSON.stringify(article.seoTitle)},
  "seoDescription": ${JSON.stringify(article.seoDescription)},
  "tags": ${article.tags}
}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const cleaned = text
    .replace(/^```json?\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
  const translated = JSON.parse(cleaned);

  const stats = readingTimeFn(translated.content);
  translated.wordCount = translated.content
    .split(/\s+/)
    .filter(Boolean).length;
  translated.readingTime = Math.max(1, Math.round(stats.minutes));

  return translated as TranslatedArticle;
}
