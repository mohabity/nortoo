CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text,
	"ip_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"phone_hash" text NOT NULL,
	"phone_last4" text,
	"name" text,
	"city" text,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"successful_orders" integer DEFAULT 0 NOT NULL,
	"failed_orders" integer DEFAULT 0 NOT NULL,
	"is_opposed" boolean DEFAULT false NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"retention_expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "data_rights_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer,
	"requester_phone_hash" text NOT NULL,
	"right_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"response_deadline" timestamp,
	"completed_at" timestamp,
	"audit_log_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"email" text NOT NULL,
	"api_key" text,
	"password_hash" text,
	"email_verified" timestamp,
	"youcan_store_id" text,
	"youcan_access_token" text,
	"shopify_store_id" text,
	"plan" text DEFAULT 'trial' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"verify_threshold" integer DEFAULT 31 NOT NULL,
	"flag_threshold" integer DEFAULT 66 NOT NULL,
	"block_threshold" integer DEFAULT 86 NOT NULL,
	"auto_block_enabled" boolean DEFAULT true NOT NULL,
	"cndp_declaration_ref" text,
	"consent_recorded_at" timestamp,
	"data_retention_months" integer DEFAULT 24 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_api_key_unique" UNIQUE("api_key"),
	CONSTRAINT "merchants_youcan_store_id_unique" UNIQUE("youcan_store_id")
);
--> statement-breakpoint
CREATE TABLE "network_profiles" (
	"phone_hash" text PRIMARY KEY NOT NULL,
	"network_score" integer DEFAULT 50 NOT NULL,
	"total_orders_network" integer DEFAULT 0 NOT NULL,
	"total_failures_network" integer DEFAULT 0 NOT NULL,
	"merchant_count" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"order_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opposition_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_hash" text NOT NULL,
	"merchant_id" integer,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"customer_id" integer,
	"external_id" text,
	"external_ref" text,
	"customer_name" text,
	"customer_phone_last4" text,
	"product_name" text,
	"total" real NOT NULL,
	"currency" text DEFAULT 'MAD' NOT NULL,
	"shipping_city" text,
	"shipping_address" text,
	"fraud_score" integer DEFAULT 25 NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"decision" text DEFAULT 'ship' NOT NULL,
	"scoring_factors" text,
	"scoring_version" text DEFAULT 'v1.0',
	"override_decision" text,
	"override_by" text,
	"override_reason" text,
	"override_at" timestamp,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp,
	"retention_expires_at" timestamp,
	"pipeline_status" text DEFAULT 'pending' NOT NULL,
	"pipeline_processed_at" timestamp,
	"review_deadline" timestamp,
	"escalated_at" timestamp,
	"merchant_notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"scored_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_rights_requests" ADD CONSTRAINT "data_rights_requests_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_rights_requests" ADD CONSTRAINT "data_rights_requests_audit_log_id_audit_logs_id_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_merchant_created_idx" ON "audit_logs" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_merchant_phone_idx" ON "customers" USING btree ("merchant_id","phone_hash");--> statement-breakpoint
CREATE INDEX "notifications_merchant_read_idx" ON "notifications" USING btree ("merchant_id","read");--> statement-breakpoint
CREATE INDEX "notifications_merchant_created_idx" ON "notifications" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "opposition_phone_merchant_idx" ON "opposition_list" USING btree ("phone_hash","merchant_id");--> statement-breakpoint
CREATE INDEX "orders_merchant_created_idx" ON "orders" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_merchant_decision_idx" ON "orders" USING btree ("merchant_id","decision");--> statement-breakpoint
CREATE INDEX "orders_score_idx" ON "orders" USING btree ("fraud_score");--> statement-breakpoint
CREATE INDEX "orders_merchant_pipeline_idx" ON "orders" USING btree ("merchant_id","pipeline_status");--> statement-breakpoint
CREATE INDEX "orders_review_deadline_idx" ON "orders" USING btree ("pipeline_status","review_deadline");