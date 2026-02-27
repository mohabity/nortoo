/**
 * Seed Script — caiusads merchant
 * Generates 120 realistic test orders from Nov 2025 to Feb 2026
 * Run: npx tsx scripts/seed-caiusads.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, ilike } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { hashPhone, phoneLast4 } from "../src/lib/hash";
// NOTE: all src/lib/* modules that transitively import @/db/index
// are loaded dynamically inside seed() so dotenv has time to set DATABASE_URL.

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

// 25 customers with varied profiles
const CUSTOMERS_DATA = [
  // 8 Loyal customers (3-10 successful, 0 failed)
  { name: "Ahmed Benali",         phone: "+212661112233", city: "Casablanca",  totalOrders: 10, successfulOrders: 10, failedOrders: 0 },
  { name: "Fatima Zahra Idrissi", phone: "+212662223344", city: "Rabat",       totalOrders: 7,  successfulOrders: 7,  failedOrders: 0 },
  { name: "Karim Tazi",           phone: "+212663334455", city: "Marrakech",   totalOrders: 5,  successfulOrders: 5,  failedOrders: 0 },
  { name: "Salma Bennani",        phone: "+212664445566", city: "Fès",         totalOrders: 8,  successfulOrders: 8,  failedOrders: 0 },
  { name: "Yassine El Fassi",     phone: "+212665556677", city: "Casablanca",  totalOrders: 6,  successfulOrders: 6,  failedOrders: 0 },
  { name: "Nora Amrani",          phone: "+212666667788", city: "Rabat",       totalOrders: 4,  successfulOrders: 4,  failedOrders: 0 },
  { name: "Khalid Berrada",       phone: "+212667778899", city: "Tanger",      totalOrders: 3,  successfulOrders: 3,  failedOrders: 0 },
  { name: "Leila Chakir",         phone: "+212668889900", city: "Agadir",      totalOrders: 5,  successfulOrders: 5,  failedOrders: 0 },

  // 7 New customers (0 orders)
  { name: "Youssef Lahlou",       phone: "+212669901122", city: "Kénitra",     totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Imane Kettani",        phone: "+212670012233", city: "Meknès",      totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Hamza Filali",         phone: "+212671123344", city: "Oujda",       totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Zineb Ouazzani",       phone: "+212672234455", city: "Tanger",      totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Amine Hajji",          phone: "+212673345566", city: "Agadir",      totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Sara Benkirane",       phone: "+212674456677", city: "Casablanca",  totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Reda Slaoui",          phone: "+212675567788", city: "Marrakech",   totalOrders: 0, successfulOrders: 0, failedOrders: 0 },

  // 5 Medium-risk customers (1-3 successful, 1-2 failed)
  { name: "Hassan Moussaoui",     phone: "+212676678899", city: "Tétouan",     totalOrders: 4, successfulOrders: 2, failedOrders: 2 },
  { name: "Nadia Alaoui",         phone: "+212677789900", city: "Oujda",       totalOrders: 3, successfulOrders: 2, failedOrders: 1 },
  { name: "Mehdi Chraibi",        phone: "+212678890011", city: "Kénitra",     totalOrders: 3, successfulOrders: 1, failedOrders: 2 },
  { name: "Khadija El Ouardi",    phone: "+212679901122", city: "Tanger",      totalOrders: 2, successfulOrders: 1, failedOrders: 1 },
  { name: "Rachid Bouzidi",       phone: "+212680012233", city: "Meknès",      totalOrders: 3, successfulOrders: 2, failedOrders: 1 },

  // 5 Recidivists (0-1 successful, 2-5 failed)
  { name: "Omar Haddad",          phone: "+212681123344", city: "Taza",        totalOrders: 5, successfulOrders: 0, failedOrders: 5 },
  { name: "Soufiane Belhaj",      phone: "+212682234455", city: "Khouribga",   totalOrders: 4, successfulOrders: 1, failedOrders: 3 },
  { name: "Houda Fassi",          phone: "+212683345566", city: "Sidi Slimane",totalOrders: 3, successfulOrders: 0, failedOrders: 3 },
  { name: "Mouad Zbair",          phone: "+212684456677", city: "Ouarzazate",  totalOrders: 4, successfulOrders: 0, failedOrders: 4 },
  { name: "Samira Dahbi",         phone: "+212685567788", city: "Errachidia",  totalOrders: 3, successfulOrders: 1, failedOrders: 2 },
];

const PRODUCTS = [
  { id: "prod_101", name: "T-shirt Nike Dri-FIT",          price: 349,  category: "Vêtements" },
  { id: "prod_102", name: "Robe Caftan Traditionnelle",    price: 890,  category: "Vêtements" },
  { id: "prod_103", name: "Montre Casio G-Shock",          price: 750,  category: "Accessoires" },
  { id: "prod_104", name: "Baskets Puma RS-X",             price: 680,  category: "Chaussures" },
  { id: "prod_105", name: "Parfum Dior Sauvage",           price: 950,  category: "Beauté" },
  { id: "prod_106", name: "Écouteurs Bluetooth JBL",       price: 250,  category: "Électronique" },
  { id: "prod_107", name: "Coque iPhone 15 Pro",           price: 89,   category: "Accessoires" },
  { id: "prod_108", name: "Palette Maquillage MAC",        price: 320,  category: "Beauté" },
  { id: "prod_109", name: "Sac Bandoulière Guess",         price: 450,  category: "Accessoires" },
  { id: "prod_110", name: "Lampe LED Smart WiFi",          price: 185,  category: "Maison" },
  { id: "prod_111", name: "Crème Nivea Coffret",           price: 120,  category: "Beauté" },
  { id: "prod_112", name: "Portefeuille Tommy Hilfiger",   price: 420,  category: "Accessoires" },
  { id: "prod_113", name: "Lunettes Ray-Ban Aviator",      price: 1100, category: "Accessoires" },
  { id: "prod_114", name: "Montre Xiaomi Band 8",          price: 299,  category: "Électronique" },
  { id: "prod_115", name: "Running Adidas Ultraboost",     price: 1250, category: "Chaussures" },
  { id: "prod_116", name: "Chemise Zara Slim",             price: 280,  category: "Vêtements" },
  { id: "prod_117", name: "Sneakers New Balance 574",      price: 790,  category: "Chaussures" },
  { id: "prod_118", name: "Sac à Dos Eastpak",             price: 350,  category: "Accessoires" },
  { id: "prod_119", name: "Tablette Samsung Galaxy Tab",   price: 1500, category: "Électronique" },
  { id: "prod_120", name: "Casque Audio Sony WH-1000",     price: 1350, category: "Électronique" },
];

const ADDRESSES_BY_CITY: Record<string, string[]> = {
  "Casablanca": [
    "123 Bd Zerktouni, Maarif, Casablanca 20100",
    "45 Rue Ibnou Rochd, Gauthier, Casablanca",
    "78 Av Hassan II, Centre Ville, Casablanca",
    "Residence Atlas, hay hassani, Casablanca 20200",
    "14 Rue Ahmed El Bidaoui, Sidi Moumen, Casablanca",
    "Lot 23 Ain Sebaa, Casablanca 20250",
    "67 Bd Moulay Youssef, Derb Sultan, Casablanca",
    "Hay Mohammadi, Nr Marjane, Casablanca 20350",
    "32 Rue Anfa, Anfa Superieur, Casablanca 20050",
    "11 Lotissement Bernoussi, Casablanca 20600",
  ],
  "Rabat": [
    "12 Av Mohammed V, Agdal, Rabat 10000",
    "56 Rue Oukaimeden, Hassan, Rabat 10020",
    "Hay Riad, Nr Mega Mall, Rabat 10100",
    "23 Rue Ouezzane, Souissi, Rabat 10170",
    "Quartier Ocean, Rabat 10050",
  ],
  "Marrakech": [
    "34 Derb Moulay Abdallah, Gueliz, Marrakech 40000",
    "89 Av Mohammed VI, Hivernage, Marrakech",
    "Hay Hassani, Nr Carrefour, Marrakech 40020",
    "Lot 56, Targa, Marrakech 40150",
    "12 Rue Bab Doukkala, Medina, Marrakech",
  ],
  "Tanger": [
    "23 Rue de la Liberté, Tanger 90000",
    "67 Bd Pasteur, Centre, Tanger",
    "Hay Benkirane, Tanger 90040",
    "Quartier Moujahidine, Tanger 90020",
    "Lot 78 Boukhalef, Tanger 90060",
  ],
  "Fès": [
    "11 Rue Talaa Kbira, Medina, Fes 30000",
    "45 Av des FAR, Ville Nouvelle, Fes",
    "Hay Saada, Route Sefrou, Fes 30050",
    "Quartier Narjiss, Fes 30006",
  ],
  "Agadir": [
    "78 Av Hassan II, Talborjt, Agadir 80000",
    "Hay Mohammadi, Agadir 80020",
    "Cite Dakhla, Agadir 80060",
  ],
  "Meknès": [
    "34 Av Moulay Ismail, Meknes 50000",
    "Hay Salam, Meknes 50050",
  ],
  "Kénitra": [
    "56 Rue Mohammed V, Kenitra 14000",
    "Hay Oulad Oujih, Kenitra 14020",
  ],
  "Oujda": [
    "12 Bd Allal Ben Abdallah, Oujda 60000",
    "Hay El Qods, Oujda 60020",
  ],
  "Tétouan": [
    "23 Av Mohammed V, Tetouan 93000",
    "Quartier Saniat Rmel, Tetouan 93020",
  ],
  "Taza": ["rue taza", "taza centre", "hay salam taza"],
  "Ouarzazate": ["centre ouarzazate", "hay el massira ouarzazate"],
  "Khouribga": ["hay mohammadi khouribga", "centre khouribga"],
  "Sidi Slimane": ["sidi slimane centre", "hay nahda sidi slimane"],
  "Errachidia": ["centre errachidia", "hay moulay ali cherif errachidia"],
  "Sidi Kacem": ["hay salam sidi kacem"],
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a date between Nov 2025 and Feb 2026
 * month: 0=Nov, 1=Dec, 2=Jan, 3=Feb
 */
function dateInRange(month: number, hour?: number): Date {
  const months = [
    { year: 2025, month: 10 }, // Nov 2025
    { year: 2025, month: 11 }, // Dec 2025
    { year: 2026, month: 0 },  // Jan 2026
    { year: 2026, month: 1 },  // Feb 2026
  ];
  const m = months[month];
  const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
  const day = randomInt(1, daysInMonth);
  const h = hour ?? randomInt(7, 23);
  return new Date(m.year, m.month, day, h, randomInt(0, 59), randomInt(0, 59));
}

function retentionDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 24);
  return d;
}

// ═══════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════

async function seed() {
  console.log("🌱 Starting seed for caiusads...\n");

  // Dynamic imports — these modules transitively import @/db/index
  const { scoreOrder } = await import("../src/lib/scoring");
  const { executePipeline } = await import("../src/lib/pipeline");
  const { parseAddress } = await import("../src/lib/address-parser");
  const { generateExplanation } = await import("../src/lib/score-explanation");
  const { buildSearchIndex } = await import("../src/lib/search");

  // ── 1. Find merchant ──
  console.log("🔍 Looking for caiusads merchant...");
  const merchants = await db
    .select({
      id: schema.merchants.id,
      name: schema.merchants.name,
      verifyThreshold: schema.merchants.verifyThreshold,
      flagThreshold: schema.merchants.flagThreshold,
      blockThreshold: schema.merchants.blockThreshold,
      autoBlockEnabled: schema.merchants.autoBlockEnabled,
      dataRetentionMonths: schema.merchants.dataRetentionMonths,
    })
    .from(schema.merchants)
    .where(ilike(schema.merchants.name, "%caiusads%"))
    .limit(1);

  if (merchants.length === 0) {
    console.error("❌ Merchant 'caiusads' not found. Make sure the merchant exists in the DB.");
    process.exit(1);
  }

  const merchant = merchants[0];
  const merchantId = merchant.id;
  console.log(`   ↳ Found: ${merchant.name} (id: ${merchantId})`);

  const thresholds = {
    verify: merchant.verifyThreshold,
    flag: merchant.flagThreshold,
    block: merchant.blockThreshold,
  };

  // ── 2. Upsert Customers ──
  console.log("\n👥 Upserting 25 customers...");

  const customerIds: Map<string, number> = new Map();
  const customerProfiles: Map<number, (typeof CUSTOMERS_DATA)[0]> = new Map();

  for (const custData of CUSTOMERS_DATA) {
    const phoneH = hashPhone(custData.phone);
    const last4 = phoneLast4(custData.phone);

    const existing = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.merchantId, merchantId),
          eq(schema.customers.phoneHash, phoneH)
        )
      )
      .limit(1);

    let custId: number;
    const custValues = {
      merchantId,
      phoneHash: phoneH,
      phoneLast4: last4,
      name: custData.name,
      city: custData.city,
      totalOrders: custData.totalOrders,
      successfulOrders: custData.successfulOrders,
      failedOrders: custData.failedOrders,
      isOpposed: false,
      firstSeen: dateInRange(0), // first seen in Nov
      lastSeen: dateInRange(3),  // last seen in Feb
      retentionExpiresAt: retentionDate(),
    };

    if (existing.length > 0) {
      custId = existing[0].id;
      await db
        .update(schema.customers)
        .set(custValues)
        .where(eq(schema.customers.id, custId));
    } else {
      const [inserted] = await db
        .insert(schema.customers)
        .values(custValues)
        .returning({ id: schema.customers.id });
      custId = inserted.id;
    }

    customerIds.set(custData.phone, custId);
    customerProfiles.set(custId, custData);
    console.log(`   ↳ ${custData.name} (${last4}) → id: ${custId}`);
  }

  // ── 3. Clean existing data for idempotency ──
  console.log("\n🗑️  Cleaning existing orders + notifications + stats...");
  await db.delete(schema.notifications).where(eq(schema.notifications.merchantId, merchantId));
  await db.delete(schema.orders).where(eq(schema.orders.merchantId, merchantId));
  await db
    .delete(schema.auditLogs)
    .where(and(eq(schema.auditLogs.merchantId, merchantId), eq(schema.auditLogs.action, "score")));
  await db
    .delete(schema.auditLogs)
    .where(and(eq(schema.auditLogs.merchantId, merchantId), eq(schema.auditLogs.action, "pipeline_executed")));
  await db.delete(schema.productStats).where(eq(schema.productStats.merchantId, merchantId));
  await db.delete(schema.cityStats).where(eq(schema.cityStats.merchantId, merchantId));
  await db.delete(schema.zoneStats).where(eq(schema.zoneStats.merchantId, merchantId));
  console.log("   ↳ Done");

  // ── 4. Build order configs ──
  console.log("\n📋 Generating 120 scored orders (Nov 2025 → Feb 2026)...");

  const customerList = Array.from(customerIds.entries());
  let orderNum = 5000;

  interface OrderConfig {
    customerIndex: number;
    city: string;
    productIndex: number;
    month: number; // 0=Nov, 1=Dec, 2=Jan, 3=Feb
    hour: number;
    deliveryStatus: string;
    quantity: number;
  }

  const orderConfigs: OrderConfig[] = [];

  // ── Ship orders (50) — loyal customers, safe cities ──
  for (let i = 0; i < 50; i++) {
    const custIdx = i % 8; // loyal customers 0-7
    const safeCities = ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Kénitra"];
    // Distribute across months: ~12 Nov, ~14 Dec, ~14 Jan, ~10 Feb
    const month = i < 12 ? 0 : i < 26 ? 1 : i < 40 ? 2 : 3;
    const delivered = month < 3; // older orders more likely delivered
    orderConfigs.push({
      customerIndex: custIdx,
      city: safeCities[i % safeCities.length],
      productIndex: i % PRODUCTS.length,
      month,
      hour: randomInt(8, 22),
      deliveryStatus: delivered
        ? randomItem(["delivered", "delivered", "shipped"])
        : randomItem(["shipped", "pending", "delivered"]),
      quantity: randomInt(1, 2),
    });
  }

  // ── Verify orders (30) — new customers, moderate amounts ──
  for (let i = 0; i < 30; i++) {
    const custIdx = 8 + (i % 7); // new customers 8-14
    const cities = ["Casablanca", "Rabat", "Tanger", "Kénitra", "Oujda", "Agadir", "Marrakech"];
    const month = i < 7 ? 0 : i < 15 ? 1 : i < 23 ? 2 : 3;
    const highPriceProducts = PRODUCTS.filter((p) => p.price > 400);
    orderConfigs.push({
      customerIndex: custIdx,
      city: cities[i % cities.length],
      productIndex: PRODUCTS.indexOf(randomItem(highPriceProducts)),
      month,
      hour: randomInt(8, 23),
      deliveryStatus: randomItem(["pending", "shipped", "pending", "delivered"]),
      quantity: randomInt(1, 3),
    });
  }

  // ── Flag orders (25) — medium-risk customers, risky cities, high amounts ──
  for (let i = 0; i < 25; i++) {
    const custIdx = 15 + (i % 5); // medium-risk customers 15-19
    const riskyCities = ["Taza", "Ouarzazate", "Khouribga", "Errachidia", "Sidi Kacem", "Oujda", "Tétouan"];
    const expensive = PRODUCTS.filter((p) => p.price > 600);
    const month = i < 5 ? 0 : i < 12 ? 1 : i < 19 ? 2 : 3;
    orderConfigs.push({
      customerIndex: custIdx,
      city: riskyCities[i % riskyCities.length],
      productIndex: PRODUCTS.indexOf(randomItem(expensive)),
      month,
      hour: randomInt(7, 23),
      deliveryStatus: randomItem(["pending", "returned", "pending", "cancelled"]),
      quantity: randomInt(1, 2),
    });
  }

  // ── Block orders (15) — recidivists, very risky, high amounts, some night ──
  for (let i = 0; i < 15; i++) {
    const custIdx = 20 + (i % 5); // recidivists 20-24
    const riskyCities = ["Taza", "Sidi Slimane", "Khouribga", "Errachidia", "Ouarzazate"];
    const veryExpensive = PRODUCTS.filter((p) => p.price > 800);
    const month = i < 3 ? 0 : i < 7 ? 1 : i < 11 ? 2 : 3;
    orderConfigs.push({
      customerIndex: custIdx,
      city: riskyCities[i % riskyCities.length],
      productIndex: PRODUCTS.indexOf(randomItem(veryExpensive)),
      month,
      hour: i % 3 === 0 ? randomInt(1, 5) : randomInt(8, 22), // 1/3 night orders
      deliveryStatus: randomItem(["cancelled", "returned", "cancelled"]),
      quantity: randomInt(1, 4),
    });
  }

  // Shuffle for realistic distribution
  orderConfigs.sort(() => Math.random() - 0.5);

  // ── 5. Insert orders ──
  const stats = { ship: 0, verify: 0, flag: 0, block: 0 };
  const pipelineStats = {
    auto_shipped: 0,
    needs_review: 0,
    escalated: 0,
    auto_blocked: 0,
    merchant_override: 0,
  };
  const merchantSettings = {
    verifyThreshold: thresholds.verify,
    flagThreshold: thresholds.flag,
    blockThreshold: thresholds.block,
    autoBlockEnabled: merchant.autoBlockEnabled,
  };

  const insertedOrders: Array<{
    id: number;
    orderRef: string;
    score: number;
    decision: string;
    customerName: string;
    pipelineStatus: string;
    createdAt: Date;
  }> = [];

  for (const cfg of orderConfigs) {
    orderNum++;
    const [phone, custId] = customerList[cfg.customerIndex];
    const custData = customerProfiles.get(custId)!;
    const product = PRODUCTS[cfg.productIndex] ?? randomItem(PRODUCTS);
    const city = cfg.city;
    const addresses = ADDRESSES_BY_CITY[city] ?? [`${city} centre`];
    const address = randomItem(addresses);
    const createdAt = dateInRange(cfg.month, cfg.hour);

    const parsed = parseAddress(address);

    const customerHistory =
      custData.totalOrders > 0
        ? {
            totalOrders: custData.totalOrders,
            successfulOrders: custData.successfulOrders,
            failedOrders: custData.failedOrders,
          }
        : undefined;

    const result = scoreOrder(
      {
        total: product.price * cfg.quantity,
        city,
        address,
        hour: cfg.hour,
        quantity: cfg.quantity,
        customer: customerHistory,
        customerName: custData.name,
      },
      thresholds
    );

    stats[result.decision]++;

    const explanation = generateExplanation(
      result.score,
      result.decision,
      result.factors,
      result.confidence
    );

    const orderRef = `#${orderNum}`;
    const pipelineResult = executePipeline({
      score: result.score,
      decision: result.decision,
      total: product.price * cfg.quantity,
      merchantSettings,
      orderRef,
      customerName: custData.name,
    });

    const pipelineProcessedAt = new Date(createdAt.getTime() + 1000);

    const [insertedOrder] = await db
      .insert(schema.orders)
      .values({
        merchantId,
        customerId: custId,
        externalId: `yc_seed_${orderNum}`,
        externalRef: orderRef,
        customerName: custData.name,
        customerPhoneLast4: phoneLast4(phone),
        productName: product.name,
        productId: product.id,
        productCategory: product.category,
        productPrice: product.price,
        quantity: cfg.quantity,
        total: product.price * cfg.quantity,
        currency: "MAD",
        shippingCity: city,
        shippingAddress: address,
        parsedCity: parsed.city,
        parsedZone: parsed.zone,
        parsedPostalCode: parsed.postalCode,
        addressConfidence: parsed.confidence,
        fraudScore: result.score,
        riskLevel: result.riskLevel,
        decision: result.decision,
        scoringFactors: JSON.stringify(result.factors),
        scoreExplanation: JSON.stringify(explanation),
        scoringVersion: result.version,
        searchIndex: buildSearchIndex({
          externalRef: orderRef,
          customerName: custData.name,
          shippingCity: city,
          parsedZone: parsed.zone,
          shippingAddress: address,
          productName: product.name,
          total: product.price * cfg.quantity,
          customerPhoneLast4: phoneLast4(phone),
        }),
        deliveryStatus: cfg.deliveryStatus,
        deliveredAt: cfg.deliveryStatus === "delivered" ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        retentionExpiresAt: retentionDate(),
        createdAt,
        scoredAt: new Date(createdAt.getTime() + 500),
        pipelineStatus: pipelineResult.status,
        pipelineProcessedAt,
        reviewDeadline: pipelineResult.reviewDeadline,
        escalationPriority: pipelineResult.escalationPriority,
        merchantNotifiedAt: pipelineProcessedAt,
      })
      .returning({ id: schema.orders.id });

    insertedOrders.push({
      id: insertedOrder.id,
      orderRef,
      score: result.score,
      decision: result.decision,
      customerName: custData.name,
      pipelineStatus: pipelineResult.status,
      createdAt,
    });

    pipelineStats[pipelineResult.status as keyof typeof pipelineStats]++;

    // Audit log: scoring
    await db.insert(schema.auditLogs).values({
      merchantId,
      actor: "system",
      action: "score",
      targetType: "order",
      targetId: String(insertedOrder.id),
      details: JSON.stringify({
        score: result.score,
        decision: result.decision,
        riskLevel: result.riskLevel,
        version: result.version,
      }),
      createdAt,
    });

    // Audit log: pipeline
    await db.insert(schema.auditLogs).values({
      merchantId,
      actor: "system",
      action: "pipeline_executed",
      targetType: "order",
      targetId: String(insertedOrder.id),
      details: JSON.stringify({
        pipelineStatus: pipelineResult.status,
        severity: pipelineResult.severity,
        reviewDeadline: pipelineResult.reviewDeadline?.toISOString() ?? null,
      }),
      createdAt: pipelineProcessedAt,
    });

    console.log(
      `   ↳ ${orderRef} | ${custData.name.padEnd(22)} | ${city.padEnd(14)} | ${(product.price * cfg.quantity).toString().padStart(5)} DH | Score: ${result.score.toString().padStart(3)} | ${result.decision.padEnd(6)} | ${pipelineResult.status.padEnd(16)} | ${cfg.deliveryStatus}`
    );
  }

  // ── 6. Post-process: escalate + override some ──
  console.log("\n🔄 Post-processing pipeline overrides...");

  const needsReview = insertedOrders.filter((o) => o.pipelineStatus === "needs_review");
  const toEscalate = needsReview.slice(0, Math.min(8, needsReview.length));
  for (const order of toEscalate) {
    const escalatedAt = new Date(order.createdAt.getTime() + 3 * 60 * 60 * 1000);
    await db
      .update(schema.orders)
      .set({
        pipelineStatus: "escalated",
        escalatedAt,
        reviewDeadline: new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000),
      })
      .where(eq(schema.orders.id, order.id));
    pipelineStats.escalated++;
    pipelineStats.needs_review--;
    order.pipelineStatus = "escalated";
    console.log(`   ↳ Escalated: ${order.orderRef} — ${order.customerName}`);
  }

  const overrideCandidates = insertedOrders.filter(
    (o) => o.pipelineStatus === "needs_review" || o.pipelineStatus === "escalated"
  );
  const toOverride = overrideCandidates.slice(0, Math.min(5, overrideCandidates.length));
  for (const order of toOverride) {
    const overrideAt = new Date(order.createdAt.getTime() + 1 * 60 * 60 * 1000);
    const prevStatus = order.pipelineStatus as keyof typeof pipelineStats;
    await db
      .update(schema.orders)
      .set({
        pipelineStatus: "merchant_override",
        overrideDecision: order.score > thresholds.flag ? "flag" : "ship",
        overrideBy: "merchant",
        overrideReason: "Vérification manuelle effectuée",
        overrideAt,
      })
      .where(eq(schema.orders.id, order.id));
    pipelineStats.merchant_override++;
    pipelineStats[prevStatus]--;
    order.pipelineStatus = "merchant_override";
    console.log(`   ↳ Override: ${order.orderRef} — ${order.customerName}`);
  }

  // ── 7. Notifications ──
  console.log("\n🔔 Inserting notifications...");

  const notificationSeeds: Array<{
    orderId: number;
    type: string;
    title: string;
    message: string;
    severity: string;
    read: boolean;
    createdAt: Date;
  }> = [];

  const autoShipped = insertedOrders.filter((o) => o.pipelineStatus === "auto_shipped");
  for (const order of autoShipped.slice(0, 5)) {
    notificationSeeds.push({
      orderId: order.id,
      type: "order_auto_shipped",
      title: `Commande ${order.orderRef} — expédition auto`,
      message: `Score ${order.score}/100 — ${order.customerName}. Risque faible, expédition recommandée.`,
      severity: "info",
      read: true,
      createdAt: new Date(order.createdAt.getTime() + 1500),
    });
  }

  const reviewOrders = insertedOrders.filter((o) => o.pipelineStatus === "needs_review");
  for (let i = 0; i < Math.min(6, reviewOrders.length); i++) {
    const order = reviewOrders[i];
    notificationSeeds.push({
      orderId: order.id,
      type: "order_needs_review",
      title: `Commande ${order.orderRef} à vérifier`,
      message: `Score ${order.score}/100 — ${order.customerName}. Vérification requise.`,
      severity: "warning",
      read: i < 3,
      createdAt: new Date(order.createdAt.getTime() + 1500),
    });
  }

  const escalated = insertedOrders.filter((o) => o.pipelineStatus === "escalated");
  for (const order of escalated.slice(0, 4)) {
    notificationSeeds.push({
      orderId: order.id,
      type: "escalation",
      title: `Commande ${order.orderRef} — escalade`,
      message: `Délai de vérification dépassé pour ${order.customerName}. Score ${order.score}/100. Action urgente requise.`,
      severity: "critical",
      read: false,
      createdAt: new Date(order.createdAt.getTime() + 3 * 60 * 60 * 1000 + 1000),
    });
  }

  const blocked = insertedOrders.filter((o) => o.pipelineStatus === "auto_blocked");
  for (let i = 0; i < Math.min(5, blocked.length); i++) {
    const order = blocked[i];
    notificationSeeds.push({
      orderId: order.id,
      type: "order_auto_blocked",
      title: `Commande ${order.orderRef} bloquée automatiquement`,
      message: `Score ${order.score}/100 — ${order.customerName}. Blocage automatique activé.`,
      severity: "critical",
      read: i > 1,
      createdAt: new Date(order.createdAt.getTime() + 1500),
    });
  }

  const overridden = insertedOrders.filter((o) => o.pipelineStatus === "merchant_override");
  for (const order of overridden.slice(0, 3)) {
    notificationSeeds.push({
      orderId: order.id,
      type: "order_needs_review",
      title: `Commande ${order.orderRef} à vérifier`,
      message: `Score ${order.score}/100 — ${order.customerName}. [Résolu par override marchand]`,
      severity: "warning",
      read: true,
      createdAt: new Date(order.createdAt.getTime() + 1500),
    });
  }

  for (const notif of notificationSeeds) {
    await db.insert(schema.notifications).values({
      merchantId,
      orderId: notif.orderId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      severity: notif.severity,
      read: notif.read,
      actionUrl: `/dashboard/orders?selected=${notif.orderId}`,
      createdAt: notif.createdAt,
    });
  }

  const unreadCount = notificationSeeds.filter((n) => !n.read).length;
  console.log(`   ↳ ${notificationSeeds.length} notifications (${unreadCount} non lues)`);

  // ── 8. Recalculate stats (dynamic imports to avoid @/db/index hoisting) ──
  console.log("\n📈 Recalculating product, city & zone stats...");
  const { recalculateAllProductStats } = await import("../src/lib/product-stats");
  const { recalculateAllCityStats } = await import("../src/lib/city-stats");
  const { recalculateAllZoneStats } = await import("../src/lib/zone-stats");
  const productsUpdated = await recalculateAllProductStats(merchantId);
  const citiesUpdated = await recalculateAllCityStats(merchantId);
  const zonesUpdated = await recalculateAllZoneStats(merchantId);
  console.log(`   ↳ ${productsUpdated} product stats`);
  console.log(`   ↳ ${citiesUpdated} city stats`);
  console.log(`   ↳ ${zonesUpdated} zone stats`);

  // ── Summary ──
  const total = stats.ship + stats.verify + stats.flag + stats.block;
  console.log("\n📊 Distribution des décisions:");
  console.log(`   Ship:   ${stats.ship} (${Math.round((stats.ship / total) * 100)}%)`);
  console.log(`   Verify: ${stats.verify} (${Math.round((stats.verify / total) * 100)}%)`);
  console.log(`   Flag:   ${stats.flag} (${Math.round((stats.flag / total) * 100)}%)`);
  console.log(`   Block:  ${stats.block} (${Math.round((stats.block / total) * 100)}%)`);

  console.log("\n🚀 Distribution pipeline:");
  console.log(`   Auto-expédié:      ${pipelineStats.auto_shipped}`);
  console.log(`   À vérifier:        ${pipelineStats.needs_review}`);
  console.log(`   Escaladé:          ${pipelineStats.escalated}`);
  console.log(`   Auto-bloqué:       ${pipelineStats.auto_blocked}`);
  console.log(`   Override marchand: ${pipelineStats.merchant_override}`);

  console.log(`\n✅ Seed terminé — ${total} commandes insérées pour "${merchant.name}"`);
  console.log(`   • 25 clients marocains`);
  console.log(`   • ${total} commandes scorées (Nov 2025 → Fév 2026)`);
  console.log(`   • ${notificationSeeds.length} notifications`);
  console.log(`   • ${productsUpdated + citiesUpdated + zonesUpdated} stats recalculées`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
