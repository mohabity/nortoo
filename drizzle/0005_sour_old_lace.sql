ALTER TABLE "merchants" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "current_month_orders" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "current_month_start" timestamp;--> statement-breakpoint

-- Rename growth → pro
UPDATE merchants SET plan = 'pro' WHERE plan = 'growth';