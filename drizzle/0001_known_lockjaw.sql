CREATE TABLE "city_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"city_normalized" text NOT NULL,
	"city_display" text NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"delivered_orders" integer DEFAULT 0 NOT NULL,
	"returned_orders" integer DEFAULT 0 NOT NULL,
	"cancelled_orders" integer DEFAULT 0 NOT NULL,
	"rto_rate" real DEFAULT 0 NOT NULL,
	"avg_score" real DEFAULT 0,
	"avg_order_value" real DEFAULT 0,
	"risk_tier" text DEFAULT 'unknown' NOT NULL,
	"last_order_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"product_category" text,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"delivered_orders" integer DEFAULT 0 NOT NULL,
	"returned_orders" integer DEFAULT 0 NOT NULL,
	"cancelled_orders" integer DEFAULT 0 NOT NULL,
	"rto_rate" real DEFAULT 0 NOT NULL,
	"avg_order_value" real DEFAULT 0,
	"total_revenue" real DEFAULT 0,
	"last_order_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "youcan_store_name" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "invite_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_category" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "product_price" real;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "city_stats" ADD CONSTRAINT "city_stats_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_created_by_merchants_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stats" ADD CONSTRAINT "product_stats_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "city_stats_merchant_city_idx" ON "city_stats" USING btree ("merchant_id","city_normalized");--> statement-breakpoint
CREATE INDEX "city_stats_rto_idx" ON "city_stats" USING btree ("merchant_id","rto_rate");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_code_idx" ON "invite_links" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "product_stats_merchant_product_idx" ON "product_stats" USING btree ("merchant_id","product_id");--> statement-breakpoint
CREATE INDEX "product_stats_rto_idx" ON "product_stats" USING btree ("merchant_id","rto_rate");