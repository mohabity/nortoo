DROP INDEX "orders_score_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_backup_codes" text;--> statement-breakpoint
CREATE INDEX "orders_merchant_score_idx" ON "orders" USING btree ("merchant_id","fraud_score");--> statement-breakpoint
CREATE INDEX "orders_merchant_delivery_idx" ON "orders" USING btree ("merchant_id","delivery_status");