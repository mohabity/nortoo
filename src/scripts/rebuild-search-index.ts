/**
 * Rebuild search_index for all existing orders.
 * Run: npx tsx src/scripts/rebuild-search-index.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull, or } from "drizzle-orm";
import * as schema from "../db/schema";
import { buildSearchIndex } from "../lib/search";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("🔍 Rebuilding search index...\n");

  // Fetch all orders without a search index (or all if --force)
  const forceAll = process.argv.includes("--force");

  const condition = forceAll
    ? undefined
    : or(isNull(schema.orders.searchIndex), eq(schema.orders.searchIndex, ""));

  const allOrders = await db
    .select({
      id: schema.orders.id,
      externalRef: schema.orders.externalRef,
      customerName: schema.orders.customerName,
      customerPhoneLast4: schema.orders.customerPhoneLast4,
      shippingCity: schema.orders.shippingCity,
      shippingAddress: schema.orders.shippingAddress,
      parsedZone: schema.orders.parsedZone,
      productName: schema.orders.productName,
      total: schema.orders.total,
    })
    .from(schema.orders)
    .where(condition);

  console.log(`   Found ${allOrders.length} orders to index\n`);

  let updated = 0;
  for (const order of allOrders) {
    const searchIndex = buildSearchIndex({
      externalRef: order.externalRef,
      customerName: order.customerName,
      shippingCity: order.shippingCity,
      parsedZone: order.parsedZone,
      shippingAddress: order.shippingAddress,
      productName: order.productName,
      total: order.total,
      customerPhoneLast4: order.customerPhoneLast4,
    });

    await db
      .update(schema.orders)
      .set({ searchIndex })
      .where(eq(schema.orders.id, order.id));

    updated++;
    if (updated % 10 === 0 || updated === allOrders.length) {
      process.stdout.write(`\r   Indexing... ${updated}/${allOrders.length}`);
    }
  }

  console.log(`\n\n✅ Done! ${updated} orders indexed.`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
