/**
 * CLI: Create an invite link.
 *
 * Usage:
 *   npm run invite:create -- CODE "Label" [maxUses]
 *
 * Examples:
 *   npm run invite:create -- BETA2026 "Beta launch" 100
 *   npm run invite:create -- VIP "VIP access"
 *   npm run invite:create                              # auto-generated code
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { randomBytes } from "crypto";
import * as schema from "../db/schema";

config({ path: ".env.local" });

async function main() {
  const args = process.argv.slice(2);
  const code = args[0] || randomBytes(6).toString("hex").toUpperCase();
  const label = args[1] || "Invitation";
  const maxUses = args[2] ? parseInt(args[2], 10) : null;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not found in .env.local");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const [invite] = await db
    .insert(schema.inviteLinks)
    .values({
      code,
      label,
      maxUses,
      createdBy: 1, // admin
    })
    .returning();

  const { getAppUrl } = await import("@/lib/env");
  const appUrl = getAppUrl();

  console.log("\nInvite created!");
  console.log(`  Code:     ${invite.code}`);
  console.log(`  Label:    ${invite.label}`);
  console.log(`  Max uses: ${invite.maxUses ?? "unlimited"}`);
  console.log(`  URL:      ${appUrl}/go/${invite.code}`);
  console.log();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
