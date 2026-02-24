CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"period" text NOT NULL,
	"plan_at_invoice" text NOT NULL,
	"amount_ht" integer NOT NULL,
	"tva_rate" integer DEFAULT 20 NOT NULL,
	"amount_tva" integer NOT NULL,
	"amount_ttc" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"paid_note" text,
	"due_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "billing_name" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "billing_ice" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_merchant_idx" ON "invoices" USING btree ("merchant_id");