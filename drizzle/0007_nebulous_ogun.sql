CREATE TABLE "phone_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"phone_hash" text NOT NULL,
	"phone_masked" text NOT NULL,
	"list_type" text NOT NULL,
	"reason" text,
	"added_by" text DEFAULT 'merchant' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phone_list" ADD CONSTRAINT "phone_list_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "phone_list_merchant_phone_idx" ON "phone_list" USING btree ("merchant_id","phone_hash");--> statement-breakpoint
CREATE INDEX "phone_list_merchant_idx" ON "phone_list" USING btree ("merchant_id");