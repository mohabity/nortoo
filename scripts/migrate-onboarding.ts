/**
 * Migration script for Onboarding Sprint
 * Adds youcan_store_name + invite_code columns to merchants
 * Creates invite_links table
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running onboarding migration...\n");

  // 1. Add youcan_store_name to merchants
  try {
    await sql`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS youcan_store_name TEXT`;
    console.log("  Added youcan_store_name to merchants");
  } catch (e: unknown) {
    console.log("  youcan_store_name already exists or error:", (e as Error).message);
  }

  // 2. Add invite_code to merchants
  try {
    await sql`ALTER TABLE merchants ADD COLUMN IF NOT EXISTS invite_code TEXT`;
    console.log("  Added invite_code to merchants");
  } catch (e: unknown) {
    console.log("  invite_code already exists or error:", (e as Error).message);
  }

  // 3. Create invite_links table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS invite_links (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        max_uses INTEGER,
        current_uses INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP,
        created_by INTEGER REFERENCES merchants(id),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        metadata TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log("  Created invite_links table");
  } catch (e: unknown) {
    console.log("  invite_links table error:", (e as Error).message);
  }

  // 4. Create unique index on code
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS invite_code_idx ON invite_links (code)`;
    console.log("  Created invite_code_idx index");
  } catch (e: unknown) {
    console.log("  invite_code_idx already exists:", (e as Error).message);
  }

  console.log("\nMigration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
