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
import { relations, sql } from "drizzle-orm";

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

  // Auth
  passwordHash: text("password_hash"),        // bcrypt hash — null if OAuth-only
  emailVerified: timestamp("email_verified"), // null until verified

  // Platform integrations
  youcanStoreId: text("youcan_store_id").unique(),
  youcanAccessToken: text("youcan_access_token"),
  youcanStoreName: text("youcan_store_name"),
  shopifyStoreId: text("shopify_store_id"),

  // Billing
  plan: text("plan").notNull().default("trial"), // trial | starter | growth | scale
  inviteCode: text("invite_code"),               // invite code used at signup
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
    productId: text("product_id"),
    productCategory: text("product_category"),
    productPrice: real("product_price"),
    quantity: integer("quantity").default(1),
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

    // Pipeline orchestration
    pipelineStatus: text("pipeline_status").notNull().default("pending"),
    // values: pending | auto_shipped | needs_review | escalated | auto_blocked | merchant_override
    pipelineProcessedAt: timestamp("pipeline_processed_at"),
    reviewDeadline: timestamp("review_deadline"),
    escalatedAt: timestamp("escalated_at"),
    merchantNotifiedAt: timestamp("merchant_notified_at"),

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
    index("orders_merchant_pipeline_idx").on(
      table.merchantId,
      table.pipelineStatus
    ),
    index("orders_review_deadline_idx").on(
      table.pipelineStatus,
      table.reviewDeadline
    ),
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
// NOTIFICATIONS — Pipeline alerts for merchants
// ═══════════════════════════════════════════════════════════
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    orderId: integer("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),

    type: text("type").notNull(),
    // "order_auto_shipped" | "order_needs_review" | "order_flagged" | "order_auto_blocked" | "escalation" | "daily_summary"

    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: text("severity").notNull().default("info"), // "info" | "warning" | "critical"
    read: boolean("read").notNull().default(false),
    actionUrl: text("action_url"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_merchant_read_idx").on(table.merchantId, table.read),
    index("notifications_merchant_created_idx").on(
      table.merchantId,
      table.createdAt
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
// INVITE LINKS — Liens d'invitation magiques
// ═══════════════════════════════════════════════════════════
export const inviteLinks = pgTable(
  "invite_links",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    label: text("label").notNull(),
    maxUses: integer("max_uses"),
    currentUses: integer("current_uses").notNull().default(0),
    expiresAt: timestamp("expires_at"),
    createdBy: integer("created_by").references(() => merchants.id),
    isActive: boolean("is_active").notNull().default(true),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("invite_code_idx").on(table.code),
  ]
);

// ═══════════════════════════════════════════════════════════
// PRODUCT STATS — Per-product delivery statistics
// Aggregated data for SKU risk tracking
// ═══════════════════════════════════════════════════════════
export const productStats = pgTable(
  "product_stats",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    productName: text("product_name").notNull(),
    productCategory: text("product_category"),

    totalOrders: integer("total_orders").notNull().default(0),
    deliveredOrders: integer("delivered_orders").notNull().default(0),
    returnedOrders: integer("returned_orders").notNull().default(0),
    cancelledOrders: integer("cancelled_orders").notNull().default(0),

    rtoRate: real("rto_rate").notNull().default(0), // 0.0–1.0
    avgOrderValue: real("avg_order_value").default(0),
    totalRevenue: real("total_revenue").default(0), // DH

    lastOrderAt: timestamp("last_order_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_stats_merchant_product_idx").on(
      table.merchantId,
      table.productId
    ),
    index("product_stats_rto_idx").on(table.merchantId, table.rtoRate),
  ]
);

// ═══════════════════════════════════════════════════════════
// CITY STATS — Per-city delivery statistics
// Aggregated data for dynamic geographic risk scoring
// ═══════════════════════════════════════════════════════════
export const cityStats = pgTable(
  "city_stats",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    cityNormalized: text("city_normalized").notNull(), // lowercase, alias-resolved
    cityDisplay: text("city_display").notNull(), // UI display

    totalOrders: integer("total_orders").notNull().default(0),
    deliveredOrders: integer("delivered_orders").notNull().default(0),
    returnedOrders: integer("returned_orders").notNull().default(0),
    cancelledOrders: integer("cancelled_orders").notNull().default(0),

    rtoRate: real("rto_rate").notNull().default(0), // 0.0–1.0
    avgScore: real("avg_score").default(0),
    avgOrderValue: real("avg_order_value").default(0),
    riskTier: text("risk_tier").notNull().default("unknown"), // safe | moderate | risky | dangerous | unknown

    lastOrderAt: timestamp("last_order_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("city_stats_merchant_city_idx").on(
      table.merchantId,
      table.cityNormalized
    ),
    index("city_stats_rto_idx").on(table.merchantId, table.rtoRate),
  ]
);

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════
export const merchantsRelations = relations(merchants, ({ many }) => ({
  customers: many(customers),
  orders: many(orders),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
  productStats: many(productStats),
  cityStats: many(cityStats),
}));

export const inviteLinksRelations = relations(inviteLinks, ({ one }) => ({
  createdByMerchant: one(merchants, {
    fields: [inviteLinks.createdBy],
    references: [merchants.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [customers.merchantId],
    references: [merchants.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  merchant: one(merchants, {
    fields: [notifications.merchantId],
    references: [merchants.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
}));

export const productStatsRelations = relations(productStats, ({ one }) => ({
  merchant: one(merchants, {
    fields: [productStats.merchantId],
    references: [merchants.id],
  }),
}));

export const cityStatsRelations = relations(cityStats, ({ one }) => ({
  merchant: one(merchants, {
    fields: [cityStats.merchantId],
    references: [merchants.id],
  }),
}));
