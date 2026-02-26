CREATE TABLE "blog_daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"total_pageviews" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"cta_clicks" integer DEFAULT 0 NOT NULL,
	"blog_to_signup" integer DEFAULT 0 NOT NULL,
	"top_articles" text,
	"top_referrers" text,
	"top_countries" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_daily_stats_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"merchant_id" integer,
	"orders_received" integer DEFAULT 0 NOT NULL,
	"orders_scored" integer DEFAULT 0 NOT NULL,
	"orders_confirmed" integer DEFAULT 0 NOT NULL,
	"orders_rejected" integer DEFAULT 0 NOT NULL,
	"orders_no_response" integer DEFAULT 0 NOT NULL,
	"orders_shipped" integer DEFAULT 0 NOT NULL,
	"orders_delivered" integer DEFAULT 0 NOT NULL,
	"orders_returned" integer DEFAULT 0 NOT NULL,
	"avg_score" real DEFAULT 0,
	"score_low" integer DEFAULT 0 NOT NULL,
	"score_medium" integer DEFAULT 0 NOT NULL,
	"score_high" integer DEFAULT 0 NOT NULL,
	"whatsapp_sent" integer DEFAULT 0 NOT NULL,
	"whatsapp_delivered" integer DEFAULT 0 NOT NULL,
	"whatsapp_read" integer DEFAULT 0 NOT NULL,
	"whatsapp_replied" integer DEFAULT 0 NOT NULL,
	"mrr_dh" integer DEFAULT 0 NOT NULL,
	"active_merchants" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer,
	"user_id" integer,
	"event_name" text NOT NULL,
	"event_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_metrics_date_merchant_idx" ON "daily_metrics" USING btree ("date","merchant_id");--> statement-breakpoint
CREATE INDEX "daily_metrics_date_idx" ON "daily_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "product_events_merchant_event_idx" ON "product_events" USING btree ("merchant_id","event_name");--> statement-breakpoint
CREATE INDEX "product_events_event_idx" ON "product_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "product_events_created_idx" ON "product_events" USING btree ("created_at");