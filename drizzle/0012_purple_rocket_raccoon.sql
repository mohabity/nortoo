CREATE TABLE "blog_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"translation_of_id" integer,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"tags" text DEFAULT '[]' NOT NULL,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	"canonical_url" text,
	"cover_image_url" text,
	"cover_image_alt" text,
	"reading_time" integer,
	"word_count" integer,
	"quality_score" integer,
	"status" text DEFAULT 'generating' NOT NULL,
	"topic_id" integer,
	"generated_at" timestamp,
	"published_at" timestamp,
	"translated_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"articles_per_week" integer DEFAULT 3 NOT NULL,
	"min_queue_size" integer DEFAULT 10 NOT NULL,
	"auto_translate" boolean DEFAULT true NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"paused_until" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"target_keywords" text DEFAULT '[]' NOT NULL,
	"tone" text DEFAULT 'expert-accessible',
	"target_word_count" integer DEFAULT 1500,
	"status" text DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp,
	"article_id" integer,
	"article_en_id" integer,
	"error_message" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coupon_id" integer NOT NULL,
	"merchant_id" integer NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"effect" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "locale" text DEFAULT 'fr' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blog_articles_slug_locale_idx" ON "blog_articles" USING btree ("slug","locale");--> statement-breakpoint
CREATE INDEX "blog_articles_status_locale_idx" ON "blog_articles" USING btree ("status","locale");--> statement-breakpoint
CREATE INDEX "blog_articles_category_idx" ON "blog_articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX "blog_articles_published_at_idx" ON "blog_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_articles_translation_idx" ON "blog_articles" USING btree ("translation_of_id");--> statement-breakpoint
CREATE INDEX "blog_topics_status_priority_idx" ON "blog_topics" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_idx" ON "coupon_redemptions" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_merchant_idx" ON "coupon_redemptions" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_merchant_coupon_idx" ON "coupon_redemptions" USING btree ("merchant_id","coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");