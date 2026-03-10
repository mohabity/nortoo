/**
 * Startup environment variable validation.
 * Import this in instrumentation.ts or layout.tsx to catch missing config early.
 */

const REQUIRED_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
] as const;

const RECOMMENDED_VARS = [
  "ADMIN_SESSION_SECRET",
  "ADMIN_SETUP_KEY",
  "TOKEN_ENCRYPTION_KEY",
  "PHONE_HASH_SALT",
  "CRON_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) warnings.push(key);
  }

  // Check for legacy ADMIN_SECRET without new split vars
  if (process.env.ADMIN_SECRET && !process.env.ADMIN_SESSION_SECRET) {
    console.warn(
      "[env] ADMIN_SECRET is deprecated. Set ADMIN_SESSION_SECRET (signing) and ADMIN_SETUP_KEY (setup) separately."
    );
  }

  if (warnings.length > 0) {
    console.warn(`[env] Recommended env vars missing: ${warnings.join(", ")}`);
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Required env vars missing: ${missing.join(", ")}. Server cannot start safely.`
    );
  }
}
