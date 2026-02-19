import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  real,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// MERCHANTS — Responsables du traitement (Art. 14 Loi 09-08)
// ═══════════════════════════════════════════════════════════
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  email: text("email").notNull(),

  // API Key — merchant copies this into their webhook config
  apiKey: text("api_key").unique(),

  // Platform integrations
  youcanStoreId: text("youcan_store_id").unique(),
  youcanAccessToken: text("youcan_access_token"),
  shopifyStoreId: text("shopify_store_id"),

  // Billing
  plan: text("plan").notNull().default("trial"), // trial | starter | growth | scale
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // Scoring settings
  verifyThreshold: integer("verify_threshold").notNull().default(31),
  flagThreshold: integer("flag_threshold").notNull().default(66),
  blockThreshold: integer("block_threshold").notNull().default(86),
  autoBlockEnabled: boolean("auto_block_enabled").notNull().default(true),

  // Compliance — Loi 09-08
  cndpDeclarationRef: text("cndp_declaration_ref"),
  consentRecordedAt: timestamp("consent_recorded_at"),
  dataRetentionMonths: integer("data_retention_months").notNull().default(24),

  // Meta
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// CUSTOMERS — Personnes concernées
// ⚠️ phoneHash = SHA-256(phone + SALT) — NEVER store raw phone
// ═══════════════════════════════════════════════════════════
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),

    phoneHash: text("phone_hash").notNull(), // SHA-256 — Art. 23
    phoneLast4: text("phone_last4"),         // Display only
    name: text("name"),
    city: text("city"),

    totalOrders: integer("total_orders").notNull().default(0),
    successfulOrders: integer("successful_orders").notNull().default(0),
    failedOrders: integer("failed_orders").notNull().default(0),

    isOpposed: boolean("is_opposed").notNull().default(false), // Art. 9

    firstSeen: timestamp("first_seen").notNull().defaultNow(),
    lastSeen: timestamp("last_seen").notNull().defaultNow(),
    retentionExpiresAt: timestamp("retention_expires_at"), // Art. 3e
  },
  (table) => [
    uniqueIndex("customers_merchant_phone_idx").on(
      table.merchantId,
      table.phoneHash
    ),
  ]
);

// ═══════════════════════════════════════════════════════════
// ORDERS — Commandes scorées
// ═══════════════════════════════════════════════════════════
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id),

    // YouCan data
    externalId: text("external_id"),
    externalRef: text("external_ref"),

    // Order info
    customerName: text("customer_name"),
    customerPhoneLast4: text("customer_phone_last4"),
    productName: text("product_name"),
    total: real("total").notNull(),
    currency: text("currency").notNull().default("MAD"),
    shippingCity: text("shipping_city"),
    shippingAddress: text("shipping_address"),

    // Scoring
    fraudScore: integer("fraud_score").notNull().default(25),
    riskLevel: text("risk_level").notNull().default("low"),
    decision: text("decision").notNull().default("ship"),
    scoringFactors: text("scoring_factors"), // JSON string
    scoringVersion: text("scoring_version").default("v1.0"),

    // Override
    overrideDecision: text("override_decision"),
    overrideBy: text("override_by"),
    overrideReason: text("override_reason"),
    overrideAt: timestamp("override_at"),

    // Delivery
    deliveryStatus: text("delivery_status").notNull().default("pending"),
    deliveredAt: timestamp("delivered_at"),

    // Compliance — Art. 3e
    retentionExpiresAt: timestamp("retention_expires_at"),

    // Meta
    createdAt: timestamp("created_at").notNull().defaultNow(),
    scoredAt: timestamp("scored_at").notNull().defaultNow(),
  },
  (table) => [
    index("orders_merchant_created_idx").on(
      table.merchantId,
      table.createdAt
    ),
    index("orders_merchant_decision_idx").on(
      table.merchantId,
      table.decision
    ),
    index("orders_score_idx").on(table.fraudScore),
  ]
);

// ═══════════════════════════════════════════════════════════
// AUDIT LOGS — Art. 23 Loi 09-08 (OBLIGATOIRE)
// Every data mutation must be logged
// ═══════════════════════════════════════════════════════════
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id").references(() => merchants.id),

    actor: text("actor").notNull(), // system | merchant | consumer | admin
    action: text("action").notNull(), // score | override | access_request | delete | export | login | settings_change
    targetType: text("target_type"), // order | customer | merchant | settings
    targetId: text("target_id"),
    details: text("details"), // JSON context
    ipHash: text("ip_hash"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_merchant_created_idx").on(
      table.merchantId,
      table.createdAt
    ),
  ]
);

// ═══════════════════════════════════════════════════════════
// DATA RIGHTS REQUESTS — Art. 7-9 Loi 09-08 (OBLIGATOIRE)
// ═══════════════════════════════════════════════════════════
export const dataRightsRequests = pgTable("data_rights_requests", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),

  requesterPhoneHash: text("requester_phone_hash").notNull(),
  rightType: text("right_type").notNull(), // access | rectification | deletion | opposition
  status: text("status").notNull().default("pending"), // pending | processing | completed | refused
  responseDeadline: timestamp("response_deadline"),
  completedAt: timestamp("completed_at"),
  auditLogId: integer("audit_log_id").references(() => auditLogs.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// OPPOSITION LIST — Art. 9 Loi 09-08
// If a consumer opposes, their scoring is disabled
// ═══════════════════════════════════════════════════════════
export const oppositionList = pgTable(
  "opposition_list",
  {
    id: serial("id").primaryKey(),
    phoneHash: text("phone_hash").notNull(),
    merchantId: integer("merchant_id"), // NULL = global opposition
    reason: text("reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("opposition_phone_merchant_idx").on(
      table.phoneHash,
      table.merchantId
    ),
  ]
);

// ═══════════════════════════════════════════════════════════
// NETWORK PROFILES — Phase 2 (needs CNDP authorization Art. 12.1.f)
// ⚠️ Only aggregated data — NEVER personal info cross-merchant
// ═══════════════════════════════════════════════════════════
export const networkProfiles = pgTable("network_profiles", {
  phoneHash: text("phone_hash").primaryKey(), // SHA-256 only
  networkScore: integer("network_score").notNull().default(50),
  totalOrdersNetwork: integer("total_orders_network").notNull().default(0),
  totalFailuresNetwork: integer("total_failures_network").notNull().default(0),
  merchantCount: integer("merchant_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════
export const merchantsRelations = relations(merchants, ({ many }) => ({
  customers: many(customers),
  orders: many(orders),
  auditLogs: many(auditLogs),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [customers.merchantId],
    references: [merchants.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
}));
