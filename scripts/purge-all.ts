/**
 * Purge Script — Reset total de la base de données
 * Supprime TOUTES les données de TOUTES les tables (merchants, orders, customers, etc.)
 * Les tables et schémas sont conservés, seules les données sont supprimées.
 *
 * Usage:
 *   npx tsx scripts/purge-all.ts
 *
 * Sécurité:
 *   - Demande confirmation interactive avant d'exécuter
 *   - Passer --yes pour skip la confirmation (CI/scripts)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import * as readline from "readline";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL manquante. Vérifiez .env.local");
  process.exit(1);
}

// All tables in dependency-safe order (TRUNCATE CASCADE handles it, but listed for clarity)
const ALL_TABLES = [
  // Leaf tables (no dependents)
  "ticket_replies",
  "admin_mfa_codes",
  "user_mfa_codes",
  "coupon_redemptions",
  "notifications",
  "webhook_queue",
  "phone_list",
  "invoices",
  "usage_logs",
  "password_reset_tokens",
  "email_verification_tokens",
  "product_stats",
  "city_stats",
  "zone_stats",
  "data_rights_requests",
  "opposition_list",
  "network_profiles",
  "cron_runs",
  "blog_articles",
  "blog_topics",
  "blog_config",
  "invite_links",
  // Mid-level
  "orders",
  "audit_logs",
  "support_tickets",
  "customers",
  "coupons",
  "users",
  "admin_users",
  // Root
  "merchants",
];

async function confirm(): Promise<boolean> {
  if (process.argv.includes("--yes")) return true;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log("\n⚠️  ATTENTION: Ceci va supprimer TOUTES les données de TOUTES les tables.");
    console.log(`📍 Base: ${DATABASE_URL!.replace(/\/\/.*@/, "//***@")}`);
    console.log(`📋 Tables: ${ALL_TABLES.length}\n`);
    rl.question("Tapez PURGE pour confirmer: ", (answer) => {
      rl.close();
      resolve(answer.trim() === "PURGE");
    });
  });
}

async function purge() {
  const ok = await confirm();
  if (!ok) {
    console.log("Annulé.");
    process.exit(0);
  }

  const sql = neon(DATABASE_URL!);

  console.log("\n🗑️  Purge en cours...\n");

  // TRUNCATE all tables in a single statement with CASCADE
  // This is atomic and handles FK constraints
  const tableList = ALL_TABLES.join(", ");
  await sql(`TRUNCATE TABLE ${tableList} CASCADE`);

  console.log(`✅ ${ALL_TABLES.length} tables vidées.`);
  console.log("\nBase de données clean. Prêt pour repartir de zéro.");
}

purge().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
