import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { blogConfig, blogTopics } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const initialTopics = [
  { title: "Comment réduire son taux RTO de 40% à 15% : Guide pratique COD Maroc", category: "guide", keywords: ["réduire RTO", "taux retour COD Maroc", "RTO e-commerce"], wordCount: 1500, priority: 10 },
  { title: "Qu'est-ce que le scoring de commandes COD et comment ça marche ?", category: "guide", keywords: ["scoring commande COD", "fraud scoring e-commerce"], wordCount: 1500, priority: 10 },
  { title: "État du e-commerce COD au Maroc en 2026 : chiffres clés", category: "industry", keywords: ["e-commerce COD Maroc 2026", "statistiques e-commerce Maroc"], wordCount: 2000, priority: 9 },
  { title: "Les 7 villes marocaines avec le plus haut taux de retour COD", category: "industry", keywords: ["taux retour par ville Maroc", "RTO géographie Maroc"], wordCount: 1500, priority: 9 },
  { title: "5 erreurs qui augmentent votre taux RTO (et comment les éviter)", category: "guide", keywords: ["erreurs RTO", "améliorer livraison COD"], wordCount: 1200, priority: 8 },
  { title: "WhatsApp pour confirmer les commandes COD : le guide complet", category: "guide", keywords: ["WhatsApp confirmation commande", "COD WhatsApp Maroc"], wordCount: 1800, priority: 7 },
  { title: "Comparatif transporteurs COD au Maroc 2026", category: "industry", keywords: ["transporteur COD Maroc", "Amana Express", "J&T Maroc"], wordCount: 2000, priority: 7 },
  { title: "Comment calculer le coût réel d'un retour COD", category: "guide", keywords: ["coût retour COD", "calcul RTO", "pertes COD"], wordCount: 1200, priority: 6 },
  { title: "Pourquoi les clients ne récupèrent pas leurs colis (et que faire)", category: "guide", keywords: ["colis non récupéré", "améliorer taux livraison Maroc"], wordCount: 1500, priority: 6 },
  { title: "Intégrer YouCan avec un outil de scoring COD", category: "product", keywords: ["YouCan intégration", "nortoo YouCan", "scoring COD YouCan"], wordCount: 1500, priority: 5 },
  { title: "Paiement à la livraison vs paiement en ligne au Maroc : quel avenir ?", category: "industry", keywords: ["COD vs paiement en ligne Maroc", "avenir COD"], wordCount: 1800, priority: 4 },
  { title: "Comment les marchands turcs ont réduit leur taux RTO de 60% à 10%", category: "case-study", keywords: ["RTO Turquie", "benchmark COD international"], wordCount: 1500, priority: 4 },
  { title: "Le guide du marchand e-commerce débutant au Maroc (2026)", category: "guide", keywords: ["e-commerce débutant Maroc", "lancer boutique en ligne"], wordCount: 2500, priority: 3 },
  { title: "Automatiser la gestion des commandes COD : outils et workflow", category: "guide", keywords: ["automatiser COD", "workflow commandes e-commerce"], wordCount: 1500, priority: 3 },
  { title: "Comment choisir entre Amana, J&T et ZR Express pour vos livraisons COD", category: "industry", keywords: ["Amana vs J&T", "transporteur COD comparatif"], wordCount: 1500, priority: 3 },
  { title: "L'impact du Ramadan sur les taux de retour COD au Maroc", category: "industry", keywords: ["Ramadan e-commerce Maroc", "RTO Ramadan"], wordCount: 1200, priority: 2 },
  { title: "Créer des publicités Facebook qui génèrent des commandes COD qualifiées", category: "guide", keywords: ["Facebook Ads COD Maroc", "publicité e-commerce"], wordCount: 1800, priority: 2 },
  { title: "Le problème de l'adressage au Maroc et comment le contourner", category: "industry", keywords: ["adressage Maroc", "adresses incomplètes livraison"], wordCount: 1500, priority: 2 },
  { title: "Scoring COD : règles simples vs machine learning — que choisir ?", category: "product", keywords: ["scoring rules vs ML", "machine learning COD"], wordCount: 1500, priority: 1 },
  { title: "Comment nortoo a été conçu : de l'idée au MVP en 8 semaines", category: "product", keywords: ["nortoo story", "SaaS Maroc", "startup e-commerce"], wordCount: 1200, priority: 1 },
];

async function seed() {
  console.log("[seed-blog] Inserting blog_config singleton...");
  await db.insert(blogConfig).values({
    articlesPerWeek: 3,
    minQueueSize: 10,
    autoTranslate: true,
    paused: false,
  });

  console.log("[seed-blog] Inserting 20 initial topics...");
  for (const topic of initialTopics) {
    await db.insert(blogTopics).values({
      title: topic.title,
      category: topic.category,
      targetKeywords: JSON.stringify(topic.keywords),
      targetWordCount: topic.wordCount,
      priority: topic.priority,
    });
  }

  console.log("[seed-blog] Done! Inserted 1 config + 20 topics.");
}

seed().catch((err) => {
  console.error("[seed-blog] Error:", err);
  process.exit(1);
});
