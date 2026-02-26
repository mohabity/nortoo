import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// ═══════════════════════════════════════════════════════════
// Admin Authentication — Separate from Auth.js (merchant auth)
// Uses ADMIN_SECRET env var + HMAC session cookie
// ═══════════════════════════════════════════════════════════

export const ADMIN_COOKIE_NAME = "nortoo_admin";

/**
 * Create an HMAC session token from a nonce.
 * Cookie value = "nonce:hmac" — never stores the secret itself.
 */
export function createAdminToken(secret: string): string {
  const nonce = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const hmac = createHmac("sha256", secret).update(nonce).digest("hex");
  return `${nonce}:${hmac}`;
}

/**
 * Verify an HMAC session token against the secret.
 */
export function verifyAdminToken(token: string, secret: string): boolean {
  const idx = token.indexOf(":");
  if (idx === -1) {
    // Legacy: raw secret cookie — still accept during transition
    return safeCompare(token, secret);
  }
  const nonce = token.slice(0, idx);
  const providedHmac = token.slice(idx + 1);
  const expectedHmac = createHmac("sha256", secret).update(nonce).digest("hex");
  return safeCompare(providedHmac, expectedHmac);
}

/**
 * Check if the current request is from an authenticated admin.
 *
 * Checks two sources:
 * 1. `nortoo_admin` httpOnly cookie (HMAC token set at login)
 * 2. `Authorization: Bearer <secret>` header (for API calls)
 *
 * Uses timingSafeEqual to prevent timing attacks.
 */
export async function isAdmin(request?: Request): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  // 1. Check cookie (for page/API requests from browser)
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (adminCookie?.value && verifyAdminToken(adminCookie.value, secret)) {
      return true;
    }
  } catch {
    // cookies() may fail in certain contexts — fall through
  }

  // 2. Check Authorization header (for programmatic API calls)
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      if (safeCompare(token, secret)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
