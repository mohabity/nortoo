CREATE TABLE "usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"month" text NOT NULL,
	"orders_scored" integer DEFAULT 0 NOT NULL,
	"orders_blocked" integer DEFAULT 0 NOT NULL,
	"total_value" real DEFAULT 0 NOT NULL,
	"blocked_value" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "api_key_hash" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "billing_status" text DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_usage_merchant_month" ON "usage_logs" USING btree ("merchant_id","month");--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_api_key_hash_unique" UNIQUE("api_key_hash");