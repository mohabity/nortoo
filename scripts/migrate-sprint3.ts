/**
 * Sprint 3 Migration — Run with: npx tsx scripts/migrate-sprint3.ts
 * Adds: notifications table + pipeline columns on orders
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Sprint 3 migration starting...");

  // 1. Add pipeline columns to orders
  console.log("Adding pipeline columns to orders...");
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'pending'`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pipeline_processed_at timestamp`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_deadline timestamp`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS escalated_at timestamp`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS merchant_notified_at timestamp`;

  // 2. Create notifications table
  console.log("Creating notifications table...");
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id serial PRIMARY KEY NOT NULL,
      merchant_id integer NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      order_id integer REFERENCES orders(id) ON DELETE SET NULL,
      type text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      severity text NOT NULL DEFAULT 'info',
      read boolean NOT NULL DEFAULT false,
      action_url text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // 3. Create indexes
  console.log("Creating indexes...");
  await sql`CREATE INDEX IF NOT EXISTS orders_merchant_pipeline_idx ON orders (merchant_id, pipeline_status)`;
  await sql`CREATE INDEX IF NOT EXISTS orders_review_deadline_idx ON orders (pipeline_status, review_deadline)`;
  await sql`CREATE INDEX IF NOT EXISTS notifications_merchant_read_idx ON notifications (merchant_id, read)`;
  await sql`CREATE INDEX IF NOT EXISTS notifications_merchant_created_idx ON notifications (merchant_id, created_at)`;

  console.log("Sprint 3 migration complete!");
}

main().catch(console.error);
