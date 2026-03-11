import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { apiLimiter, safeLimit, getClientIp } from "@/lib/rate-limit";
import { MS_DAY } from "@/lib/constants";

const ADMIN_TOKEN_MAX_AGE_MS = MS_DAY; // 24 hours

// ═══════════════════════════════════════════════════════════
// Admin Authentication — Individual accounts + email MFA
// ADMIN_SESSION_SECRET = cookie signing key (separate from setup key)
// Cookie format: "adminId:nonce:hmac" (new) or "nonce:hmac" (legacy)
// ═══════════════════════════════════════════════════════════

/**
 * Get the session signing secret.
 * Prefers ADMIN_SESSION_SECRET, falls back to ADMIN_SECRET for backward compat.
 */
function getSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SECRET;
}

export const ADMIN_COOKIE_NAME = "nortoo_admin";

/**
 * Create an HMAC session token for a specific admin user.
 * Cookie value = "adminId:nonce:hmac" — encodes who is logged in.
 */
export function createAdminToken(adminId: number, secret: string): string {
  const nonce = Date.now().toString(36) + randomBytes(12).toString("hex");
  const payload = `${adminId}:${nonce}`;
  const hmac = createHmac("sha256", secret).update(payload).digest("hex");
  return `${adminId}:${nonce}:${hmac}`;
}

/**
 * Verify an HMAC session token and extract the admin user ID.
 * Returns the adminId on success, or null on failure.
 *
 * Supports three formats:
 * - New:    "adminId:nonce:hmac" → verifies HMAC, returns adminId
 * - Legacy: "nonce:hmac"        → verifies HMAC, returns 0 (transition)
 * - Raw:    raw secret cookie   → direct compare, returns 0 (transition)
 */
export function verifyAdminToken(token: string, secret: string): number | null {
  const parts = token.split(":");

  if (parts.length === 3) {
    // New format: adminId:nonce:hmac
    const [adminIdStr, nonce, providedHmac] = parts;
    const adminId = parseInt(adminIdStr, 10);
    if (isNaN(adminId) || !nonce || !providedHmac) return null;

    // TTL check: nonce starts with base-36 timestamp
    const timestampPart = nonce.slice(0, nonce.length - 24); // 24 hex chars = 12 random bytes
    const issuedAt = parseInt(timestampPart, 36);
    if (isNaN(issuedAt) || Date.now() - issuedAt > ADMIN_TOKEN_MAX_AGE_MS) return null;

    const payload = `${adminId}:${nonce}`;
    const expectedHmac = createHmac("sha256", secret).update(payload).digest("hex");
    return safeCompare(providedHmac, expectedHmac) ? adminId : null;
  }

  if (parts.length === 2) {
    // Legacy format: nonce:hmac (from shared ADMIN_SECRET era)
    const [nonce, providedHmac] = parts;
    if (!nonce || !providedHmac) return null;
    const expectedHmac = createHmac("sha256", secret).update(nonce).digest("hex");
    return safeCompare(providedHmac, expectedHmac) ? 0 : null;
  }

  // Raw secret cookie (very old legacy)
  return safeCompare(token, secret) ? 0 : null;
}

/**
 * Check if the current request is from an authenticated admin.
 * Returns true/false — backward compatible with all existing route guards.
 *
 * Checks two sources:
 * 1. `nortoo_admin` httpOnly cookie (HMAC token set at login)
 * 2. `Authorization: Bearer <secret>` header (for API calls)
 */
export async function isAdmin(request?: Request): Promise<boolean> {
  const secret = getSessionSecret();
  if (!secret) return false;

  // 1. Check cookie (for page/API requests from browser)
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (adminCookie?.value && verifyAdminToken(adminCookie.value, secret) !== null) {
      return true;
    }
  } catch {
    // cookies() may fail in certain contexts — fall through
  }

  // 2. Check Authorization header (for programmatic API calls)
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // Rate limit Bearer attempts by IP to prevent brute-force
      const ip = getClientIp(request);
      const { success } = await safeLimit(apiLimiter, `admin-bearer:${ip}`);
      if (!success) return false;

      const token = authHeader.slice(7);
      if (safeCompare(token, secret)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get the authenticated admin's user ID from the session cookie.
 * Returns the adminId (>0 for new accounts, 0 for legacy sessions), or null if not authenticated.
 */
export async function getAdminId(): Promise<number | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (adminCookie?.value) {
      return verifyAdminToken(adminCookie.value, secret);
    }
  } catch {
    // cookies() may fail in certain contexts
  }

  return null;
}

const SUPER_ADMIN_EMAIL = "admin@nortoo.ma";

/**
 * Check if the current admin is the super-admin (admin@nortoo.ma).
 * Only the super-admin can invite, deactivate, or manage other admins.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const adminId = await getAdminId();
  if (!adminId) return false;

  // Dynamic import to avoid circular deps
  const { db } = await import("@/db/index");
  const { adminUsers } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const [admin] = await db
    .select({ email: adminUsers.email })
    .from(adminUsers)
    .where(eq(adminUsers.id, adminId))
    .limit(1);

  return admin?.email === SUPER_ADMIN_EMAIL;
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
