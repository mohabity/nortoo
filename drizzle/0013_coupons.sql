-- Coupons table
CREATE TABLE IF NOT EXISTS "coupons" (
  "id" serial PRIMARY KEY,
  "code" text NOT NULL UNIQUE,
  "type" text NOT NULL,
  "value" text NOT NULL,
  "max_uses" integer,
  "used_count" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "created_by" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" ("code");

-- Coupon redemptions table
CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
  "id" serial PRIMARY KEY,
  "coupon_id" integer NOT NULL REFERENCES "coupons"("id"),
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id") ON DELETE CASCADE,
  "redeemed_at" timestamp NOT NULL DEFAULT now(),
  "effect" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "coupon_redemptions_coupon_idx" ON "coupon_redemptions" ("coupon_id");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_merchant_idx" ON "coupon_redemptions" ("merchant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_redemptions_merchant_coupon_idx" ON "coupon_redemptions" ("merchant_id", "coupon_id");
