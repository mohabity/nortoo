CREATE TABLE "zone_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"city" text NOT NULL,
	"zone" text NOT NULL,
	"postal_code" text,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"delivered_orders" integer DEFAULT 0 NOT NULL,
	"returned_orders" integer DEFAULT 0 NOT NULL,
	"blocked_orders" integer DEFAULT 0 NOT NULL,
	"rto_rate" real DEFAULT 0 NOT NULL,
	"avg_score" real DEFAULT 0,
	"avg_delivery_attempts" real DEFAULT 1,
	"last_order_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "parsed_city" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "parsed_zone" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "parsed_postal_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "address_confidence" real;--> statement-breakpoint
ALTER TABLE "zone_stats" ADD CONSTRAINT "zone_stats_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "zone_stats_merchant_city_zone_idx" ON "zone_stats" USING btree ("merchant_id","city","zone");--> statement-breakpoint
CREATE INDEX "zone_stats_city_zone_idx" ON "zone_stats" USING btree ("city","zone");