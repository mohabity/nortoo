import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GenerateTopicsInput {
  count: number;
  existingTitles: string[];
  existingArticles: { title: string; category: string }[];
  categories: string[];
  targetAudience: string;
  domain: string;
}

export interface GeneratedTopic {
  title: string;
  description: string;
  category: string;
  keywords: string[];
  wordCount: number;
  priority: number;
  tone: string;
}

export async function generateTopics(
  input: GenerateTopicsInput
): Promise<GeneratedTopic[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: `Tu es un stratège SEO content pour nortoo, un SaaS de scoring COD au Maroc.
Génère des sujets d'articles de blog optimisés pour le référencement naturel.
Chaque sujet doit cibler un intent de recherche spécifique des marchands e-commerce marocains.
Varie les catégories et les angles. Privilégie les sujets evergreen avec du search volume.
Réponds UNIQUEMENT en JSON valide : un tableau d'objets.`,
    messages: [
      {
        role: "user",
        content: `Génère ${input.count} sujets d'articles pour le blog nortoo.

AUDIENCE : ${input.targetAudience}
DOMAINE : ${input.domain}
CATÉGORIES POSSIBLES : ${input.categories.join(", ")}

SUJETS DÉJÀ TRAITÉS (ne pas répéter) :
${input.existingTitles.map((t) => `- ${t}`).join("\n")}

Réponds en JSON : tableau d'objets avec les clés :
- title (string, titre FR de l'article)
- description (string, brief de 1-2 phrases pour le rédacteur)
- category (string, une des catégories ci-dessus)
- keywords (string[], 3-5 mots-clés cibles)
- wordCount (number, 800 | 1500 | 2500 selon la profondeur nécessaire)
- priority (number, 0-10, plus haut = plus important pour le SEO)
- tone (string, "expert-accessible" par défaut, ou "data-heavy", "tutorial", "opinion")`,
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
  return JSON.parse(cleaned) as GeneratedTopic[];
}
