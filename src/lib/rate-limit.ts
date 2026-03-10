import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ═══ Shared Redis instance ═══
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ═══ Rate Limiters ═══

/** Login/Register: 5 attempts per minute per IP */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1m"),
  prefix: "rl:auth",
});

/** Webhook ingestion: 60 requests per minute per API key */
export const webhookLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1m"),
  prefix: "rl:webhook",
});

/** Dashboard API: 30 requests per minute per merchant */
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1m"),
  prefix: "rl:api",
});

/** Admin login: 5 attempts per 15 minutes per IP (strict) */
export const adminLoginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15m"),
  prefix: "rl:admin-login",
});

/** Admin MFA verification: 5 attempts per 10 minutes per IP (strict) */
export const adminMfaLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10m"),
  prefix: "rl:admin-mfa",
});

/**
 * Extract client IP from request headers (Vercel/Cloudflare compatible).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check if rate limiting is configured (env vars present).
 * Returns false if Redis is not configured — allows graceful degradation.
 */
export function isRateLimitConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

// ═══ In-memory fallback when Redis is unavailable ═══
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();
const FALLBACK_MAX = 10;
const FALLBACK_WINDOW_MS = 60_000; // 1 minute

function inMemoryLimit(key: string): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = inMemoryLimits.get(key);

  if (!entry || now > entry.resetAt) {
    inMemoryLimits.set(key, { count: 1, resetAt: now + FALLBACK_WINDOW_MS });
    return { success: true, remaining: FALLBACK_MAX - 1, reset: now + FALLBACK_WINDOW_MS };
  }

  entry.count++;
  const remaining = Math.max(0, FALLBACK_MAX - entry.count);
  return { success: entry.count <= FALLBACK_MAX, remaining, reset: entry.resetAt };
}

/**
 * Safe rate limit check — falls back to in-memory limiting if Redis is down or unconfigured.
 * Never allows unlimited requests.
 */
export async function safeLimit(
  limiter: Ratelimit,
  key: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!isRateLimitConfigured()) {
    return inMemoryLimit(key);
  }
  try {
    return await limiter.limit(key);
  } catch (err) {
    console.error("[RateLimit] Redis error, falling back to in-memory limit:", err);
    return inMemoryLimit(key);
  }
}
