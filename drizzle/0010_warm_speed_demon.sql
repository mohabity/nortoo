ALTER TABLE "merchants" ADD COLUMN "notification_preferences" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "archived_at" timestamp;