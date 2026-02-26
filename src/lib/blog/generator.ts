import Anthropic from "@anthropic-ai/sdk";
import readingTimeFn from "reading-time";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un expert en e-commerce COD au Maroc et rédacteur SEO senior pour le blog de nortoo.

AUDIENCE : Marchands e-commerce marocains utilisant YouCan, Shopify, WooCommerce. TPE/PME, 50-5000 commandes/mois, pain point = taux de retour élevé.

STYLE :
- Ton expert mais accessible, pas corporate, pas bullshit
- Data-driven : chiffres concrets, exemples réels Maroc
- Actionable : chaque section donne quelque chose à faire
- Darija / références culturelles marocaines bienvenues quand pertinent

FORMAT OBLIGATOIRE — Répondre UNIQUEMENT en JSON valide :
{
  "title": "Titre article (≤ 65 chars, keyword principal en début)",
  "slug": "titre-en-kebab-case-sans-accents (≤ 60 chars)",
  "excerpt": "Résumé accrocheur 150-160 chars, sert de meta description SEO",
  "seoTitle": "Titre SEO optimisé ≤ 60 chars | nortoo",
  "seoDescription": "Meta description 150-160 chars avec keyword principal et CTA implicite",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "content": "Article complet en Markdown (voir structure ci-dessous)"
}

STRUCTURE MARKDOWN DU CONTENT :
- Commencer directement par le texte (pas de # titre — il est rendu séparément)
- 2-3 paragraphes d'intro accrocheuse avec le problème et la promesse
- 3-6 sections en ## (H2), avec le keyword cible dans au moins 2 H2
- Sous-sections ### (H3) quand pertinent
- Listes à puces pour les étapes / critères
- Blocs "À retenir" formatés : > 💡 **À retenir** : texte...
- Blocs "Chiffre clé" formatés : > 📊 **Chiffre clé** : texte...
- Blocs "Attention" formatés : > ⚠️ **Attention** : texte...
- Tableaux Markdown quand comparaison utile
- UN SEUL lien vers nortoo, naturel et en fin d'article
- Conclusion avec récapitulatif actionable (pas de heading "Conclusion")

RÈGLES SEO :
- Keyword principal dans : le titre, l'intro, au moins 2 H2, la conclusion
- Densité keyword naturelle (pas de bourrage)
- Liens internes : mentionner 1-2 autres sujets du blog nortoo si pertinent (format [texte](/blog/slug-probable))
- Ne jamais inventer de statistiques — utiliser des fourchettes réalistes basées sur le marché marocain
- Chaque article doit apporter de la valeur standalone, même sans nortoo

LONGUEUR : Viser le nombre de mots demandé ±10%.`;

export interface GenerateArticleInput {
  topic: string;
  description?: string | null;
  category: string;
  targetKeywords: string[];
  tone: string;
  targetWordCount: number;
  locale: string;
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  content: string;
  readingTime: number;
  wordCount: number;
}

export async function generateArticle(
  input: GenerateArticleInput
): Promise<GeneratedArticle> {
  const userPrompt = `Écris un article de blog pour nortoo.ma sur le sujet suivant :

SUJET : ${input.topic}
${input.description ? `BRIEF : ${input.description}` : ""}
CATÉGORIE : ${input.category}
MOTS-CLÉS CIBLES : ${input.targetKeywords.join(", ")}
TON : ${input.tone}
LONGUEUR CIBLE : ${input.targetWordCount} mots
LANGUE : ${input.locale === "fr" ? "Français" : "English"}

Réponds UNIQUEMENT avec le JSON valide décrit dans tes instructions. Pas de markdown autour du JSON, pas de \`\`\`json, juste le JSON brut.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Parse JSON (clean possible backticks)
  const cleaned = text
    .replace(/^```json?\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
  const article = JSON.parse(cleaned);

  // Recalculate wordCount and readingTime server-side
  const stats = readingTimeFn(article.content);
  article.wordCount = article.content.split(/\s+/).filter(Boolean).length;
  article.readingTime = Math.max(1, Math.round(stats.minutes));

  return article as GeneratedArticle;
}
