CREATE TABLE "email_verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"user_id" integer,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"role" text DEFAULT 'operator' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invite_token" text,
	"invite_expires_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "webhook_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"source" text NOT NULL,
	"payload" text NOT NULL,
	"headers" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_attempt_at" timestamp,
	"next_retry_at" timestamp,
	"error_message" text,
	"error_stack" text,
	"completed_at" timestamp,
	"order_id" integer,
	"payload_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "escalation_config" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "rto_cost_fixed" integer DEFAULT 65 NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "rto_cost_percent" real DEFAULT 0.05 NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "onboarding_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "escalation_priority" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "search_index" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_queue" ADD CONSTRAINT "webhook_queue_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_verification_merchant_idx" ON "email_verification_tokens" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "password_reset_merchant_idx" ON "password_reset_tokens" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_merchant_email_idx" ON "users" USING btree ("merchant_id","email");--> statement-breakpoint
CREATE INDEX "users_invite_token_idx" ON "users" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "webhook_queue_status_retry_idx" ON "webhook_queue" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "webhook_queue_merchant_idx" ON "webhook_queue" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "webhook_queue_dedup_idx" ON "webhook_queue" USING btree ("merchant_id","payload_hash","created_at");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;