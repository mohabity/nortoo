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
  apiKey: text("api_key").unique(), // plaintext during transition → will be masked post-migration
  apiKeyHash: text("api_key_hash").unique(), // SHA-256 hash for secure lookup

  // Auth
  passwordHash: text("password_hash"),        // bcrypt hash — null if OAuth-only
  emailVerified: timestamp("email_verified"), // null until verified

  // Platform integrations
  youcanStoreId: text("youcan_store_id").unique(),
  youcanAccessToken: text("youcan_access_token"),
  youcanStoreName: text("youcan_store_name"),
  shopifyStoreId: text("shopify_store_id"),

  // Billing
  plan: text("plan").notNull().default("trial"), // trial | starter | pro | scale
  pendingPlanDowngrade: text("pending_plan_downgrade"), // null | starter | pro — effectif au prochain mois
  billingStatus: text("billing_status").notNull().default("trial"), // trial | active | past_due | cancelled
  inviteCode: text("invite_code"),               // invite code used at signup
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // Billing info (virement bancaire)
  billingName: text("billing_name"),        // Raison sociale
  billingAddress: text("billing_address"),  // Adresse de facturation
  billingICE: text("billing_ice"),          // Identifiant Commun de l'Entreprise

  // Plan usage tracking
  trialEndsAt: timestamp("trial_ends_at"),                              // null = no active trial
  currentMonthOrders: integer("current_month_orders").notNull().default(0),
  currentMonthStart: timestamp("current_month_start"),                  // reset monthly by cron

  // Scoring settings
  verifyThreshold: integer("verify_threshold").notNull().default(31),
  flagThreshold: integer("flag_threshold").notNull().default(66),
  blockThreshold: integer("block_threshold").notNull().default(86),
  autoBlockEnabled: boolean("auto_block_enabled").notNull().default(true),

  // Escalation settings (dynamic value-based escalation deadlines)
  escalationConfig: text("escalation_config"), // JSON — EscalationConfig from src/lib/escalation.ts

  // RTO cost settings (savings calculation)
  rtoCostFixed: integer("rto_cost_fixed").notNull().default(65),
  rtoCostPercent: real("rto_cost_percent").notNull().default(0.05),

  // Compliance — Loi 09-08
  cndpDeclarationRef: text("cndp_declaration_ref"),
  consentRecordedAt: timestamp("consent_recorded_at"),
  dataRetentionMonths: integer("data_retention_months").notNull().default(24),
  notificationPreferences: text("notification_preferences"), // JSON

  // Onboarding
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),

  // Preferences
  locale: text("locale").notNull().default("fr"), // "fr" | "en"

  // Meta
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// USERS — Multi-user per merchant (roles: admin | manager | operator)
// ═══════════════════════════════════════════════════════════
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"), // null for pending invites
    role: text("role").notNull().default("operator"), // admin | manager | operator
    status: text("status").notNull().default("pending"), // active | pending | disabled
    inviteToken: text("invite_token").unique(), // SHA-256 hash of raw token
    inviteExpiresAt: timestamp("invite_expires_at"),
    lastLoginAt: timestamp("last_login_at"),

    // 2FA — TOTP or Email
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    twoFactorMethod: text("two_factor_method"),        // "totp" | "email" — null if not enabled
    twoFactorSecret: text("two_factor_secret"),        // encrypted TOTP secret (TOTP only)
    twoFactorVerifiedAt: timestamp("two_factor_verified_at"),
    twoFactorBackupCodes: text("two_factor_backup_codes"), // JSON array of hashed codes (TOTP only)

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_merchant_email_idx").on(table.merchantId, table.email),
    index("users_invite_token_idx").on(table.inviteToken),
  ]
);

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

    // Parsed address (quartier-level geo scoring)
    parsedCity: text("parsed_city"),
    parsedZone: text("parsed_zone"),
    parsedPostalCode: text("parsed_postal_code"),
    addressConfidence: real("address_confidence"),

    // Scoring
    fraudScore: integer("fraud_score").notNull().default(25),
    riskLevel: text("risk_level").notNull().default("low"),
    decision: text("decision").notNull().default("ship"),
    scoringFactors: text("scoring_factors"), // JSON string
    scoreExplanation: text("score_explanation"), // JSON stringified ScoreExplanation
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
    escalationPriority: integer("escalation_priority"), // 1 = highest urgency
    merchantNotifiedAt: timestamp("merchant_notified_at"),

    // Search
    searchIndex: text("search_index"),

    // Test orders (excluded from all stats)
    isTest: boolean("is_test").notNull().default(false),

    // WhatsApp verification (Phase 1)
    whatsappVerificationStatus: text("whatsapp_verification_status"),
    // null | "sent" | "confirmed" | "rejected" | "expired"
    whatsappMessageId: text("whatsapp_message_id"),

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
    index("orders_merchant_score_idx").on(table.merchantId, table.fraudScore),
    index("orders_merchant_delivery_idx").on(table.merchantId, table.deliveryStatus),
    index("orders_merchant_pipeline_idx").on(
      table.merchantId,
      table.pipelineStatus
    ),
    index("orders_review_deadline_idx").on(
      table.pipelineStatus,
      table.reviewDeadline
    ),
    index("orders_whatsapp_msg_idx").on(table.whatsappMessageId),
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
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),

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
    // "order_auto_shipped" | "order_needs_review" | "order_flagged" | "order_auto_blocked"
    // | "escalation" | "daily_summary" | "webhook_failed" | "webhook_silent" | "webhook_dead"

    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: text("severity").notNull().default("info"), // "info" | "warning" | "critical"
    read: boolean("read").notNull().default(false),
    archivedAt: timestamp("archived_at"),
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
// ZONE STATS — Per-quartier delivery statistics
// Aggregated data for quartier-level geographic risk scoring
// ═══════════════════════════════════════════════════════════
export const zoneStats = pgTable(
  "zone_stats",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    city: text("city").notNull(), // normalized city name
    zone: text("zone").notNull(), // normalized quartier name
    postalCode: text("postal_code"),

    totalOrders: integer("total_orders").notNull().default(0),
    deliveredOrders: integer("delivered_orders").notNull().default(0),
    returnedOrders: integer("returned_orders").notNull().default(0),
    blockedOrders: integer("blocked_orders").notNull().default(0),

    rtoRate: real("rto_rate").notNull().default(0), // 0.0–1.0
    avgScore: real("avg_score").default(0),
    avgDeliveryAttempts: real("avg_delivery_attempts").default(1),

    lastOrderAt: timestamp("last_order_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("zone_stats_merchant_city_zone_idx").on(
      table.merchantId,
      table.city,
      table.zone
    ),
    index("zone_stats_city_zone_idx").on(table.city, table.zone),
  ]
);

// ═══════════════════════════════════════════════════════════
// PASSWORD RESET TOKENS — Forgot password flow
// Token stored in DB is SHA-256(rawToken). If DB leaks, tokens are unusable.
// ═══════════════════════════════════════════════════════════
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(), // SHA-256 of the raw token sent by email
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"), // null until used
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("password_reset_merchant_idx").on(table.merchantId),
  ]
);

// ═══════════════════════════════════════════════════════════
// EMAIL VERIFICATION TOKENS — Verify merchant email address
// Token stored in DB is SHA-256(rawToken). Same pattern as password reset.
// ═══════════════════════════════════════════════════════════
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    email: text("email").notNull(), // the email to verify (useful if email changes)
    token: text("token").notNull().unique(), // SHA-256 of the raw token sent by email
    expiresAt: timestamp("expires_at").notNull(), // 24h after creation
    usedAt: timestamp("used_at"), // null until used
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("email_verification_merchant_idx").on(table.merchantId),
  ]
);

// ═══════════════════════════════════════════════════════════
// WEBHOOK QUEUE — Retry queue for failed webhook processing
// Stores raw payloads for retry. DB-backed queue (no Redis needed for beta).
// ═══════════════════════════════════════════════════════════
export const webhookQueue = pgTable(
  "webhook_queue",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // "youcan" | "ingest"
    payload: text("payload").notNull(), // Full JSON body
    headers: text("headers"), // JSON of relevant headers
    status: text("status").notNull().default("pending"), // pending | processing | completed | failed | dead
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastAttemptAt: timestamp("last_attempt_at"),
    nextRetryAt: timestamp("next_retry_at"),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    completedAt: timestamp("completed_at"),
    orderId: integer("order_id"), // ref to created order on success
    payloadHash: text("payload_hash"), // SHA-256 for deduplication
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("webhook_queue_status_retry_idx").on(table.status, table.nextRetryAt),
    index("webhook_queue_merchant_idx").on(table.merchantId),
    index("webhook_queue_dedup_idx").on(
      table.merchantId,
      table.payloadHash,
      table.createdAt
    ),
  ]
);

// ═══════════════════════════════════════════════════════════
// PHONE LIST — Blacklist / Whitelist (merchant-managed)
// Overrides scoring decision: whitelist → ship, blacklist → block
// ═══════════════════════════════════════════════════════════
export const phoneList = pgTable(
  "phone_list",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),

    phoneHash: text("phone_hash").notNull(),    // SHA-256 (Art. 23)
    phoneMasked: text("phone_masked").notNull(), // "212XXXXXX567"
    listType: text("list_type").notNull(),       // "whitelist" | "blacklist"
    reason: text("reason"),                      // Optional note
    addedBy: text("added_by").notNull().default("merchant"), // "merchant" | "auto"

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("phone_list_merchant_phone_idx").on(
      table.merchantId,
      table.phoneHash
    ),
    index("phone_list_merchant_idx").on(table.merchantId),
  ]
);

// ═══════════════════════════════════════════════════════════
// INVOICES — Factures mensuelles (virement bancaire)
// ═══════════════════════════════════════════════════════════
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),

    invoiceNumber: text("invoice_number").notNull().unique(), // "NRT-2026-0001"
    period: text("period").notNull(),                         // "2026-03"
    planAtInvoice: text("plan_at_invoice").notNull(),         // plan at time of invoice

    amountHT: integer("amount_ht").notNull(),     // centimes (29900 = 299.00 DH)
    tvaRate: integer("tva_rate").notNull().default(20),
    amountTVA: integer("amount_tva").notNull(),   // centimes
    amountTTC: integer("amount_ttc").notNull(),   // centimes

    status: text("status").notNull().default("pending"), // pending | paid | overdue | cancelled
    paidAt: timestamp("paid_at"),
    paidNote: text("paid_note"),     // référence virement
    dueDate: timestamp("due_date").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("invoices_merchant_idx").on(table.merchantId),
  ]
);

// ═══════════════════════════════════════════════════════════
// USAGE LOGS — Monthly usage history per merchant (billing)
// ═══════════════════════════════════════════════════════════
export const usageLogs = pgTable(
  "usage_logs",
  {
    id: serial("id").primaryKey(),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // "2026-03"
    ordersScored: integer("orders_scored").notNull().default(0),
    ordersBlocked: integer("orders_blocked").notNull().default(0),
    totalValue: real("total_value").notNull().default(0),
    blockedValue: real("blocked_value").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_usage_merchant_month").on(table.merchantId, table.month),
  ]
);

// ═══════════════════════════════════════════════════════════
// COUPONS — Promotional codes (trial extension + first month free)
// ═══════════════════════════════════════════════════════════
export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),            // UPPERCASE, e.g. "PROMO30"
    type: text("type").notNull(),                     // "trial_extension" | "first_month_free"
    value: text("value").notNull(),                   // days (e.g. "30") or plan id (e.g. "starter")
    maxUses: integer("max_uses"),                     // null = unlimited
    usedCount: integer("used_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at"),               // null = never expires
    createdBy: text("created_by").notNull(),          // admin identifier
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("coupons_code_idx").on(table.code),
  ]
);

// ═══════════════════════════════════════════════════════════
// COUPON REDEMPTIONS — Track who redeemed what
// ═══════════════════════════════════════════════════════════
export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: serial("id").primaryKey(),
    couponId: integer("coupon_id")
      .notNull()
      .references(() => coupons.id),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
    effect: text("effect").notNull(),                 // JSON describing what happened
  },
  (table) => [
    index("coupon_redemptions_coupon_idx").on(table.couponId),
    index("coupon_redemptions_merchant_idx").on(table.merchantId),
    uniqueIndex("coupon_redemptions_merchant_coupon_idx").on(
      table.merchantId,
      table.couponId
    ),
  ]
);

// ═══════════════════════════════════════════════════════════
// ADMIN USERS — Individual admin accounts (replaces shared ADMIN_SECRET login)
// ═══════════════════════════════════════════════════════════
export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"), // bcrypt (12 rounds) — nullable for pending invites
    isActive: boolean("is_active").notNull().default(false),
    inviteToken: text("invite_token").unique(), // SHA-256 hash of raw token
    inviteExpiresAt: timestamp("invite_expires_at"),
    invitedBy: integer("invited_by"), // admin ID who sent the invite
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_users_email_idx").on(table.email),
    index("admin_users_invite_token_idx").on(table.inviteToken),
  ]
);

// ═══════════════════════════════════════════════════════════
// USER MFA CODES — Email-based 2FA for merchant login
// Code stored in DB is SHA-256(6-digit code). Same pattern as admin MFA codes.
// ═══════════════════════════════════════════════════════════
export const userMfaCodes = pgTable(
  "user_mfa_codes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(), // SHA-256 of the 6-digit code
    expiresAt: timestamp("expires_at").notNull(), // 10 minutes after creation
    usedAt: timestamp("used_at"), // null until verified
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_mfa_codes_user_idx").on(table.userId),
  ]
);

// ═══════════════════════════════════════════════════════════
// ADMIN MFA CODES — Email-based 2FA for admin login
// Code stored in DB is SHA-256(6-digit code). Same pattern as password reset tokens.
// ═══════════════════════════════════════════════════════════
export const adminMfaCodes = pgTable(
  "admin_mfa_codes",
  {
    id: serial("id").primaryKey(),
    adminUserId: integer("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(), // SHA-256 of the 6-digit code
    expiresAt: timestamp("expires_at").notNull(), // 10 minutes after creation
    usedAt: timestamp("used_at"), // null until verified
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("admin_mfa_codes_user_idx").on(table.adminUserId),
  ]
);

// ═══════════════════════════════════════════════════════════
// CRON RUNS — Monitoring des jobs planifiés
// ═══════════════════════════════════════════════════════════
export const cronRuns = pgTable(
  "cron_runs",
  {
    id: serial("id").primaryKey(),
    cronName: text("cron_name").notNull(),
    status: text("status").notNull(), // "success" | "error"
    startedAt: timestamp("started_at").notNull(),
    finishedAt: timestamp("finished_at"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    metrics: text("metrics"), // JSON
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("cron_runs_name_idx").on(table.cronName),
    index("cron_runs_created_idx").on(table.createdAt),
  ]
);

// ═══════════════════════════════════════════════════════════
// BLOG — Articles, Topics Queue, Config
// ═══════════════════════════════════════════════════════════

export const blogArticles = pgTable(
  "blog_articles",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    locale: text("locale").notNull().default("fr"), // "fr" | "en"
    translationOfId: integer("translation_of_id"), // self-ref → FR original

    // Content
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(), // 150-160 chars = meta description
    content: text("content").notNull(), // Markdown
    category: text("category").notNull(), // "guide" | "case-study" | "industry" | "product" | "news"
    tags: text("tags").notNull().default("[]"), // JSON array

    // SEO
    seoTitle: text("seo_title").notNull(), // ≤ 60 chars
    seoDescription: text("seo_description").notNull(), // ≤ 160 chars
    canonicalUrl: text("canonical_url"),
    coverImageUrl: text("cover_image_url"),
    coverImageAlt: text("cover_image_alt"),

    // Stats
    readingTime: integer("reading_time"), // minutes
    wordCount: integer("word_count"),
    qualityScore: integer("quality_score"), // 0-100

    // Workflow
    status: text("status").notNull().default("generating"), // generating | published | failed | archived
    topicId: integer("topic_id"),

    // Timestamps
    generatedAt: timestamp("generated_at"),
    publishedAt: timestamp("published_at"),
    translatedAt: timestamp("translated_at"),
    updatedAt: timestamp("updated_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("blog_articles_slug_locale_idx").on(table.slug, table.locale),
    index("blog_articles_status_locale_idx").on(table.status, table.locale),
    index("blog_articles_category_idx").on(table.category),
    index("blog_articles_published_at_idx").on(table.publishedAt),
    index("blog_articles_translation_idx").on(table.translationOfId),
  ]
);

export const blogTopics = pgTable(
  "blog_topics",
  {
    id: serial("id").primaryKey(),

    // Topic
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    targetKeywords: text("target_keywords").notNull().default("[]"), // JSON array
    tone: text("tone").default("expert-accessible"),
    targetWordCount: integer("target_word_count").default(1500),

    // Queue
    status: text("status").notNull().default("queued"), // queued | generating | published | failed
    priority: integer("priority").notNull().default(0), // higher = published first
    scheduledFor: timestamp("scheduled_for"),

    // Result
    articleId: integer("article_id"), // FR article generated
    articleEnId: integer("article_en_id"), // EN article generated
    errorMessage: text("error_message"),
    attempts: integer("attempts").notNull().default(0),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("blog_topics_status_priority_idx").on(table.status, table.priority),
  ]
);

export const blogConfig = pgTable("blog_config", {
  id: serial("id").primaryKey(), // Always 1 (singleton)
  articlesPerWeek: integer("articles_per_week").notNull().default(3),
  minQueueSize: integer("min_queue_size").notNull().default(10),
  autoTranslate: boolean("auto_translate").notNull().default(true),
  paused: boolean("paused").notNull().default(false),
  pausedUntil: timestamp("paused_until"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════
export const merchantsRelations = relations(merchants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  orders: many(orders),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
  productStats: many(productStats),
  cityStats: many(cityStats),
  zoneStats: many(zoneStats),
  usageLogs: many(usageLogs),
  phoneList: many(phoneList),
  invoices: many(invoices),
  couponRedemptions: many(couponRedemptions),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  redemptions: many(couponRedemptions),
}));

export const couponRedemptionsRelations = relations(couponRedemptions, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponRedemptions.couponId],
    references: [coupons.id],
  }),
  merchant: one(merchants, {
    fields: [couponRedemptions.merchantId],
    references: [merchants.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [users.merchantId],
    references: [merchants.id],
  }),
  mfaCodes: many(userMfaCodes),
}));

export const userMfaCodesRelations = relations(userMfaCodes, ({ one }) => ({
  user: one(users, {
    fields: [userMfaCodes.userId],
    references: [users.id],
  }),
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

export const zoneStatsRelations = relations(zoneStats, ({ one }) => ({
  merchant: one(merchants, {
    fields: [zoneStats.merchantId],
    references: [merchants.id],
  }),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  merchant: one(merchants, {
    fields: [usageLogs.merchantId],
    references: [merchants.id],
  }),
}));

export const phoneListRelations = relations(phoneList, ({ one }) => ({
  merchant: one(merchants, {
    fields: [phoneList.merchantId],
    references: [merchants.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  merchant: one(merchants, {
    fields: [invoices.merchantId],
    references: [merchants.id],
  }),
}));

export const blogArticlesRelations = relations(blogArticles, ({ one }) => ({
  translationOf: one(blogArticles, {
    fields: [blogArticles.translationOfId],
    references: [blogArticles.id],
    relationName: "translations",
  }),
  topic: one(blogTopics, {
    fields: [blogArticles.topicId],
    references: [blogTopics.id],
  }),
}));

export const blogTopicsRelations = relations(blogTopics, ({ one }) => ({
  article: one(blogArticles, {
    fields: [blogTopics.articleId],
    references: [blogArticles.id],
    relationName: "frArticle",
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  mfaCodes: many(adminMfaCodes),
}));

export const adminMfaCodesRelations = relations(adminMfaCodes, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminMfaCodes.adminUserId],
    references: [adminUsers.id],
  }),
}));
