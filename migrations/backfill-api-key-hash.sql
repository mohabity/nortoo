-- Migration: Backfill api_key_hash for existing merchants
-- Run this ONCE after deploying the new code.
-- The new code handles both hash-based and plaintext lookups (backward compat).
--
-- After verifying the migration worked:
-- 1. All merchants should have api_key_hash populated
-- 2. The validateApiKey() function uses hash-based lookup with plaintext fallback
-- 3. In a future release, the plaintext api_key column can be masked/removed

-- Step 1: Add the column (if not already added by Drizzle push)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS api_key_hash TEXT UNIQUE;

-- Step 2: Backfill SHA-256 hashes from existing plaintext keys
UPDATE merchants
SET api_key_hash = encode(sha256(api_key::bytea), 'hex')
WHERE api_key IS NOT NULL
  AND api_key_hash IS NULL;

-- Step 3: Verify
SELECT
  COUNT(*) AS total_merchants,
  COUNT(api_key) AS with_plaintext_key,
  COUNT(api_key_hash) AS with_hash,
  COUNT(*) FILTER (WHERE api_key IS NOT NULL AND api_key_hash IS NULL) AS missing_hash
FROM merchants;
