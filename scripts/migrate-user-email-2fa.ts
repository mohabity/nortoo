/**
 * User Email 2FA Migration — Run with: npx tsx scripts/migrate-user-email-2fa.ts
 * Adds: two_factor_method column on users + user_mfa_codes table
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("User Email 2FA migration starting...");

  // 1. Add two_factor_method column to users
  console.log("Adding two_factor_method column to users...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_method text`;

  // Set method to 'totp' for existing users that have 2FA enabled
  console.log("Setting method='totp' for existing 2FA users...");
  await sql`UPDATE users SET two_factor_method = 'totp' WHERE two_factor_enabled = true AND two_factor_method IS NULL`;

  // 2. Create user_mfa_codes table
  console.log("Creating user_mfa_codes table...");
  await sql`
    CREATE TABLE IF NOT EXISTS user_mfa_codes (
      id serial PRIMARY KEY NOT NULL,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash text NOT NULL,
      expires_at timestamp NOT NULL,
      used_at timestamp,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // 3. Add index
  console.log("Creating indexes...");
  await sql`CREATE INDEX IF NOT EXISTS user_mfa_codes_user_idx ON user_mfa_codes (user_id)`;

  console.log("✅ Migration completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
