/**
 * nortoo Seed Script
 * Inserts: 2 merchants (with passwords), 15 customers, 50 scored orders, 50 audit logs
 * Run: npm run db:seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import * as schema from "./schema";
import { hashPhone, phoneLast4 } from "../lib/hash";
import { scoreOrder } from "../lib/scoring";
import { executePipeline } from "../lib/pipeline";
import { recalculateAllProductStats } from "../lib/product-stats";
import { recalculateAllCityStats } from "../lib/city-stats";
import { recalculateAllZoneStats } from "../lib/zone-stats";
import { parseAddress } from "../lib/address-parser";
import { generateExplanation } from "../lib/score-explanation";
import { buildSearchIndex } from "../lib/search";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const MERCHANTS_DATA = [
  {
    name: "TrendyShop.ma",
    domain: "trendyshop.ma",
    email: "contact@trendyshop.ma",
    password: "password123",
    apiKey: "nt_live_test_1234567890abcdef1234567890abcdef",
    plan: "pro" as const,
    verifyThreshold: 31,
    flagThreshold: 66,
    blockThreshold: 86,
    autoBlockEnabled: true,
    rtoCostFixed: 65,
    rtoCostPercent: 0.05,
    dataRetentionMonths: 24,
  },
  {
    name: "ModaMaroc",
    domain: "modamaroc.ma",
    email: "admin@modamaroc.ma",
    password: "password123",
    apiKey: "nt_live_test_abcdef1234567890abcdef1234567890",
    plan: "starter" as const,
    verifyThreshold: 31,
    flagThreshold: 66,
    blockThreshold: 86,
    autoBlockEnabled: true,
    rtoCostFixed: 65,
    rtoCostPercent: 0.05,
    dataRetentionMonths: 24,
  },
];

// 15 customers with varied profiles
// phone format: +212 6XX XXX XXX
const CUSTOMERS_DATA = [
  // 4 Loyal customers (3-7 successful, 0 failed)
  { name: "Ahmed Benali",        phone: "+212661234567", city: "Casablanca",  totalOrders: 7, successfulOrders: 7, failedOrders: 0 },
  { name: "Fatima Zahra Idrissi", phone: "+212662345678", city: "Rabat",      totalOrders: 5, successfulOrders: 5, failedOrders: 0 },
  { name: "Karim Tazi",          phone: "+212663456789", city: "Marrakech",   totalOrders: 4, successfulOrders: 3, failedOrders: 0 },
  { name: "Salma Bennani",       phone: "+212664567890", city: "Fès",         totalOrders: 6, successfulOrders: 5, failedOrders: 0 },

  // 5 New customers (0 orders)
  { name: "Youssef El Amrani",   phone: "+212665678901", city: "Tanger",      totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Imane Lahlou",        phone: "+212666789012", city: "Agadir",      totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Hamza Filali",        phone: "+212667890123", city: "Meknès",      totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Zineb Ouazzani",      phone: "+212668901234", city: "Kénitra",     totalOrders: 0, successfulOrders: 0, failedOrders: 0 },
  { name: "Amine Kettani",       phone: "+212669012345", city: "Oujda",       totalOrders: 0, successfulOrders: 0, failedOrders: 0 },

  // 3 Medium-risk customers (1-2 successful, 1 failed)
  { name: "Hassan Moussaoui",    phone: "+212670123456", city: "Ouarzazate",  totalOrders: 3, successfulOrders: 2, failedOrders: 1 },
  { name: "Nadia Alaoui",        phone: "+212671234567", city: "Tétouan",     totalOrders: 2, successfulOrders: 1, failedOrders: 1 },
  { name: "Mehdi Chraibi",       phone: "+212672345678", city: "Tanger",      totalOrders: 2, successfulOrders: 1, failedOrders: 1 },

  // 3 Recidivists (0-1 successful, 2-3 failed)
  { name: "Omar Haddad",         phone: "+212673456789", city: "Taza",        totalOrders: 3, successfulOrders: 0, failedOrders: 3 },
  { name: "Rachid Belhaj",       phone: "+212674567890", city: "Khouribga",   totalOrders: 3, successfulOrders: 1, failedOrders: 2 },
  { name: "Houda Fassi",         phone: "+212675678901", city: "Sidi Slimane", totalOrders: 2, successfulOrders: 0, failedOrders: 2 },
];

const PRODUCTS = [
  { id: "prod_001", name: "T-shirt Nike Dri-FIT", price: 349, category: "Vêtements" },
  { id: "prod_002", name: "Robe Caftan Traditionnelle", price: 890, category: "Vêtements" },
  { id: "prod_003", name: "Montre Casio G-Shock", price: 750, category: "Accessoires" },
  { id: "prod_004", name: "Baskets Puma RS-X", price: 680, category: "Chaussures" },
  { id: "prod_005", name: "Parfum Dior Sauvage", price: 950, category: "Beauté" },
  { id: "prod_006", name: "Écouteurs Bluetooth JBL", price: 250, category: "Électronique" },
  { id: "prod_007", name: "Coque iPhone 15 Pro", price: 89, category: "Accessoires" },
  { id: "prod_008", name: "Palette Maquillage MAC", price: 320, category: "Beauté" },
  { id: "prod_009", name: "Sac Bandoulière Guess", price: 450, category: "Accessoires" },
  { id: "prod_010", name: "Lampe LED Smart WiFi", price: 185, category: "Maison" },
  { id: "prod_011", name: "Crème Nivea Coffret", price: 120, category: "Beauté" },
  { id: "prod_012", name: "Portefeuille Tommy Hilfiger", price: 420, category: "Accessoires" },
  { id: "prod_013", name: "Lunettes Ray-Ban Aviator", price: 1100, category: "Accessoires" },
  { id: "prod_014", name: "Montre Xiaomi Band 8", price: 299, category: "Électronique" },
  { id: "prod_015", name: "Running Adidas Ultraboost", price: 1250, category: "Chaussures" },
  { id: "prod_016", name: "Chemise Zara Slim", price: 280, category: "Vêtements" },
  { id: "prod_017", name: "Sneakers New Balance 574", price: 790, category: "Chaussures" },
  { id: "prod_018", name: "Sac à Dos Eastpak", price: 350, category: "Accessoires" },
  { id: "prod_019", name: "Tablette Samsung Galaxy Tab", price: 1500, category: "Électronique" },
  { id: "prod_020", name: "Casque Audio Sony WH-1000", price: 1350, category: "Électronique" },
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
  "Taza": ["rue taza", "taza centre"],
  "Ouarzazate": ["centre ouarzazate"],
  "Khouribga": ["hay mohammadi khouribga"],
  "Sidi Slimane": ["sidi slimane"],
  "Sidi Kacem": ["hay salam"],
  "Errachidia": ["centre errachidia"],
};

const DELIVERY_STATUSES = ["pending", "shipped", "delivered", "returned", "cancelled"] as const;

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number, hourOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hourOffset || randomInt(6, 23), randomInt(0, 59), randomInt(0, 59));
  return d;
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
  console.log("🌱 Starting nortoo seed...\n");

  // ── 1. Upsert Merchants ──
  console.log("📦 Upserting merchants...");

  const merchantIds: number[] = [];

  for (const merchantData of MERCHANTS_DATA) {
    const { password, ...merchantFields } = merchantData;
    const passwordHash = await hash(password, 12);

    const existingMerchants = await db
      .select()
      .from(schema.merchants)
      .where(eq(schema.merchants.email, merchantData.email))
      .limit(1);

    let merchantId: number;

    if (existingMerchants.length > 0) {
      merchantId = existingMerchants[0].id;
      await db
        .update(schema.merchants)
        .set({ ...merchantFields, passwordHash, updatedAt: new Date() })
        .where(eq(schema.merchants.id, merchantId));
      console.log(`   ↳ Updated existing merchant: ${merchantData.name} (id: ${merchantId})`);
    } else {
      const [inserted] = await db
        .insert(schema.merchants)
        .values({ ...merchantFields, passwordHash })
        .returning({ id: schema.merchants.id });
      merchantId = inserted.id;
      console.log(`   ↳ Inserted new merchant: ${merchantData.name} (id: ${merchantId})`);
    }

    merchantIds.push(merchantId);
  }

  // Use first merchant for orders/customers (TrendyShop.ma)
  const primaryMerchantId = merchantIds[0];

  // ── 2. Upsert Customers ──
  console.log("\n👥 Upserting 15 customers...");

  const customerIds: Map<string, number> = new Map();
  const customerProfiles: Map<number, typeof CUSTOMERS_DATA[0]> = new Map();

  for (const custData of CUSTOMERS_DATA) {
    const phoneH = hashPhone(custData.phone);
    const last4 = phoneLast4(custData.phone);

    const existing = await db
      .select()
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.merchantId, primaryMerchantId),
          eq(schema.customers.phoneHash, phoneH)
        )
      )
      .limit(1);

    let custId: number;
    const custValues = {
      merchantId: primaryMerchantId,
      phoneHash: phoneH,
      phoneLast4: last4,
      name: custData.name,
      city: custData.city,
      totalOrders: custData.totalOrders,
      successfulOrders: custData.successfulOrders,
      failedOrders: custData.failedOrders,
      isOpposed: false,
      firstSeen: daysAgo(randomInt(30, 180)),
      lastSeen: daysAgo(randomInt(0, 5)),
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

  // ── 3. Delete existing seed data for idempotency ──
  console.log("\n🗑️  Cleaning existing orders + notifications + stats for primary merchant...");
  await db
    .delete(schema.notifications)
    .where(eq(schema.notifications.merchantId, primaryMerchantId));
  await db
    .delete(schema.orders)
    .where(eq(schema.orders.merchantId, primaryMerchantId));
  await db
    .delete(schema.auditLogs)
    .where(
      and(
        eq(schema.auditLogs.merchantId, primaryMerchantId),
        eq(schema.auditLogs.action, "score")
      )
    );
  await db
    .delete(schema.auditLogs)
    .where(
      and(
        eq(schema.auditLogs.merchantId, primaryMerchantId),
        eq(schema.auditLogs.action, "pipeline_executed")
      )
    );
  await db
    .delete(schema.productStats)
    .where(eq(schema.productStats.merchantId, primaryMerchantId));
  await db
    .delete(schema.cityStats)
    .where(eq(schema.cityStats.merchantId, primaryMerchantId));
  await db
    .delete(schema.zoneStats)
    .where(eq(schema.zoneStats.merchantId, primaryMerchantId));

  // ── 4. Insert 50 orders ──
  console.log("\n📋 Inserting 50 scored orders...");

  const thresholds = { verify: 31, flag: 66, block: 86 };
  const customerList = Array.from(customerIds.entries());
  let orderNum = 1800;

  // Distribution targets: ~25 ship, ~13 verify, ~7 flag, ~5 block
  const orderConfigs: Array<{
    customerIndex: number;
    city: string;
    productIndex: number;
    daysBack: number;
    hour: number;
    deliveryStatus: string;
  }> = [];

  // Ship orders (25) — loyal customers, safe cities, normal amounts
  for (let i = 0; i < 25; i++) {
    const custIdx = i % 4; // loyal customers 0-3
    const safeCities = ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès"];
    orderConfigs.push({
      customerIndex: custIdx,
      city: safeCities[i % safeCities.length],
      productIndex: i % PRODUCTS.length,
      daysBack: randomInt(0, 13),
      hour: randomInt(8, 22),
      deliveryStatus: randomItem(["delivered", "shipped", "pending"]),
    });
  }

  // Verify orders (13) — new customers or medium amounts, safe cities
  for (let i = 0; i < 13; i++) {
    const custIdx = 4 + (i % 5); // new customers 4-8
    const cities = ["Casablanca", "Rabat", "Tanger", "Kénitra", "Oujda", "Agadir"];
    const highPriceProducts = PRODUCTS.filter(p => p.price > 500);
    orderConfigs.push({
      customerIndex: custIdx,
      city: cities[i % cities.length],
      productIndex: PRODUCTS.indexOf(randomItem(highPriceProducts)),
      daysBack: randomInt(0, 13),
      hour: randomInt(8, 23),
      deliveryStatus: randomItem(["pending", "shipped", "pending"]),
    });
  }

  // Flag orders (7) — medium-risk customers in risky zones, or high amounts
  for (let i = 0; i < 7; i++) {
    const custIdx = 9 + (i % 3); // medium-risk customers 9-11
    const riskyCities = ["Taza", "Ouarzazate", "Khouribga", "Errachidia", "Sidi Kacem"];
    const expensiveProducts = PRODUCTS.filter(p => p.price > 700);
    orderConfigs.push({
      customerIndex: custIdx,
      city: riskyCities[i % riskyCities.length],
      productIndex: PRODUCTS.indexOf(randomItem(expensiveProducts)),
      daysBack: randomInt(0, 13),
      hour: randomInt(7, 23),
      deliveryStatus: randomItem(["pending", "returned", "pending"]),
    });
  }

  // Block orders (5) — recidivists in risky zones with high amounts, some at night
  for (let i = 0; i < 5; i++) {
    const custIdx = 12 + (i % 3); // recidivists 12-14
    const riskyCities = ["Taza", "Sidi Slimane", "Khouribga", "Sidi Kacem", "Errachidia"];
    const veryExpensive = PRODUCTS.filter(p => p.price > 900);
    orderConfigs.push({
      customerIndex: custIdx,
      city: riskyCities[i % riskyCities.length],
      productIndex: PRODUCTS.indexOf(randomItem(veryExpensive)),
      daysBack: randomInt(0, 10),
      hour: i < 2 ? randomInt(1, 4) : randomInt(8, 22), // some night orders
      deliveryStatus: randomItem(["cancelled", "returned", "pending"]),
    });
  }

  // Shuffle orders for realistic date distribution
  orderConfigs.sort(() => Math.random() - 0.5);

  const stats = { ship: 0, verify: 0, flag: 0, block: 0 };
  const pipelineStats = { auto_shipped: 0, needs_review: 0, escalated: 0, auto_blocked: 0, merchant_override: 0 };
  const merchantSettings = {
    verifyThreshold: thresholds.verify,
    flagThreshold: thresholds.flag,
    blockThreshold: thresholds.block,
    autoBlockEnabled: true,
  };

  // Track orders for post-processing pipeline overrides
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
    const createdAt = daysAgo(cfg.daysBack, cfg.hour);

    // Parse address for zone-level data
    const parsed = parseAddress(address);

    // Build scoring input
    const customerHistory = custData.totalOrders > 0
      ? {
          totalOrders: custData.totalOrders,
          successfulOrders: custData.successfulOrders,
          failedOrders: custData.failedOrders,
        }
      : undefined;

    const result = scoreOrder(
      {
        total: product.price,
        city,
        address,
        hour: cfg.hour,
        customer: customerHistory,
      },
      thresholds
    );

    stats[result.decision]++;

    // Generate human-readable explanation
    const explanation = generateExplanation(
      result.score,
      result.decision,
      result.factors,
      result.confidence
    );

    // Run pipeline engine for realistic statuses
    const orderRef = `#${orderNum}`;
    const pipelineResult = executePipeline({
      score: result.score,
      decision: result.decision,
      total: product.price,
      merchantSettings,
      orderRef,
      customerName: custData.name,
    });

    const pipelineProcessedAt = new Date(createdAt.getTime() + 1000);

    const [insertedOrder] = await db
      .insert(schema.orders)
      .values({
        merchantId: primaryMerchantId,
        customerId: custId,
        externalId: `yc_${orderNum}`,
        externalRef: orderRef,
        customerName: custData.name,
        customerPhoneLast4: phoneLast4(phone),
        productName: product.name,
        productId: product.id,
        productCategory: product.category,
        productPrice: product.price,
        quantity: randomInt(1, 3),
        total: product.price,
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
          total: product.price,
          customerPhoneLast4: phoneLast4(phone),
        }),
        deliveryStatus: cfg.deliveryStatus,
        deliveredAt: cfg.deliveryStatus === "delivered" ? daysAgo(cfg.daysBack - 2) : null,
        retentionExpiresAt: retentionDate(),
        createdAt,
        scoredAt: new Date(createdAt.getTime() + 500),
        // Pipeline fields
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

    // Audit log: scoring (Art. 23)
    await db.insert(schema.auditLogs).values({
      merchantId: primaryMerchantId,
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
      merchantId: primaryMerchantId,
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
      `   ↳ #${orderNum} | ${custData.name.padEnd(22)} | ${city.padEnd(14)} | ${product.price.toString().padStart(5)} DH | Score: ${result.score.toString().padStart(3)} | ${result.decision.padEnd(6)} | ${pipelineResult.status.padEnd(16)} | ${cfg.deliveryStatus}`
    );
  }

  // ── 5. Post-process: escalate some needs_review + override some ──
  console.log("\n🔄 Post-processing pipeline overrides...");

  // Escalate 5 needs_review orders (deadline passed)
  const needsReview = insertedOrders.filter(o => o.pipelineStatus === "needs_review");
  const toEscalate = needsReview.slice(0, Math.min(5, needsReview.length));
  for (const order of toEscalate) {
    const escalatedAt = new Date(order.createdAt.getTime() + 3 * 60 * 60 * 1000); // 3h after creation
    await db
      .update(schema.orders)
      .set({
        pipelineStatus: "escalated",
        escalatedAt,
        reviewDeadline: new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000), // deadline was 2h
      })
      .where(eq(schema.orders.id, order.id));
    pipelineStats.escalated++;
    pipelineStats.needs_review--;
    order.pipelineStatus = "escalated";
    console.log(`   ↳ Escalated: ${order.orderRef} — ${order.customerName}`);
  }

  // Override 3 orders (merchant_override)
  const overrideCandidates = insertedOrders.filter(
    o => o.pipelineStatus === "needs_review" || o.pipelineStatus === "escalated"
  );
  const toOverride = overrideCandidates.slice(0, Math.min(3, overrideCandidates.length));
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

  // ── 6. Seed notifications ──
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

  // 3 auto_shipped notifications (all read, info)
  const autoShipped = insertedOrders.filter(o => o.pipelineStatus === "auto_shipped");
  for (const order of autoShipped.slice(0, 3)) {
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

  // 4 needs_review notifications (2 read, 2 unread, warning)
  const reviewOrders = insertedOrders.filter(o => o.pipelineStatus === "needs_review");
  for (let i = 0; i < Math.min(4, reviewOrders.length); i++) {
    const order = reviewOrders[i];
    notificationSeeds.push({
      orderId: order.id,
      type: "order_needs_review",
      title: `Commande ${order.orderRef} à vérifier`,
      message: `Score ${order.score}/100 — ${order.customerName}. Vérification requise.`,
      severity: "warning",
      read: i < 2,
      createdAt: new Date(order.createdAt.getTime() + 1500),
    });
  }

  // 3 escalation notifications (all unread, critical)
  const escalated = insertedOrders.filter(o => o.pipelineStatus === "escalated");
  for (const order of escalated.slice(0, 3)) {
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

  // 3 auto_blocked notifications (1 unread, 2 read, critical)
  const blocked = insertedOrders.filter(o => o.pipelineStatus === "auto_blocked");
  for (let i = 0; i < Math.min(3, blocked.length); i++) {
    const order = blocked[i];
    notificationSeeds.push({
      orderId: order.id,
      type: "order_auto_blocked",
      title: `Commande ${order.orderRef} bloquée automatiquement`,
      message: `Score ${order.score}/100 — ${order.customerName}. Blocage automatique activé.`,
      severity: "critical",
      read: i > 0,
      createdAt: new Date(order.createdAt.getTime() + 1500),
    });
  }

  // 2 merchant_override notifications (read, info — auto-marked when override happened)
  const overridden = insertedOrders.filter(o => o.pipelineStatus === "merchant_override");
  for (const order of overridden.slice(0, 2)) {
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
      merchantId: primaryMerchantId,
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

  const unreadCount = notificationSeeds.filter(n => !n.read).length;
  console.log(`   ↳ ${notificationSeeds.length} notifications (${unreadCount} non lues)`);

  // ── 7. Recalculate product, city & zone stats ──
  console.log("\n📈 Recalculating product, city & zone stats...");
  const productsUpdated = await recalculateAllProductStats(primaryMerchantId);
  const citiesUpdated = await recalculateAllCityStats(primaryMerchantId);
  const zonesUpdated = await recalculateAllZoneStats(primaryMerchantId);
  console.log(`   ↳ ${productsUpdated} product stats recalculated`);
  console.log(`   ↳ ${citiesUpdated} city stats recalculated`);
  console.log(`   ↳ ${zonesUpdated} zone stats recalculated`);

  console.log("\n📊 Distribution des décisions:");
  console.log(`   Ship:   ${stats.ship} (${Math.round(stats.ship / 50 * 100)}%)`);
  console.log(`   Verify: ${stats.verify} (${Math.round(stats.verify / 50 * 100)}%)`);
  console.log(`   Flag:   ${stats.flag} (${Math.round(stats.flag / 50 * 100)}%)`);
  console.log(`   Block:  ${stats.block} (${Math.round(stats.block / 50 * 100)}%)`);

  console.log("\n🚀 Distribution pipeline:");
  console.log(`   Auto-expédié:      ${pipelineStats.auto_shipped}`);
  console.log(`   À vérifier:        ${pipelineStats.needs_review}`);
  console.log(`   Escaladé:          ${pipelineStats.escalated}`);
  console.log(`   Auto-bloqué:       ${pipelineStats.auto_blocked}`);
  console.log(`   Override marchand: ${pipelineStats.merchant_override}`);

  console.log("\n✅ Seed terminé avec succès!");
  console.log(`   • 2 marchands (TrendyShop.ma + ModaMaroc)`);
  console.log(`   • 15 clients marocains (pour TrendyShop.ma)`);
  console.log(`   • 50 commandes scorées avec statuts pipeline`);
  console.log(`   • ${notificationSeeds.length} notifications (${unreadCount} non lues)`);
  console.log(`   • ${productsUpdated} stats produits + ${citiesUpdated} stats villes + ${zonesUpdated} stats quartiers`);
  console.log(`   • 100+ entrées audit log`);
  console.log(`\n🔑 Identifiants de connexion:`);
  console.log(`   • contact@trendyshop.ma / password123 (plan Pro)`);
  console.log(`   • admin@modamaroc.ma / password123 (plan Starter)`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
