ALTER TABLE "admin_users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "invite_token" text;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "invite_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "invited_by" integer;--> statement-breakpoint
CREATE INDEX "admin_users_invite_token_idx" ON "admin_users" USING btree ("invite_token");--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_invite_token_unique" UNIQUE("invite_token");