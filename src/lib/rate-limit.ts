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
