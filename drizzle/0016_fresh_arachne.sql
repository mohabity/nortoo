CREATE TABLE "user_mfa_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "whatsapp_verification_status" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "whatsapp_message_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_method" text;--> statement-breakpoint
ALTER TABLE "user_mfa_codes" ADD CONSTRAINT "user_mfa_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_mfa_codes_user_idx" ON "user_mfa_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_whatsapp_msg_idx" ON "orders" USING btree ("whatsapp_message_id");