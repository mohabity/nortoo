CREATE TABLE "cron_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"cron_name" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"duration_ms" integer,
	"error" text,
	"metrics" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cron_runs_name_idx" ON "cron_runs" USING btree ("cron_name");--> statement-breakpoint
CREATE INDEX "cron_runs_created_idx" ON "cron_runs" USING btree ("created_at");