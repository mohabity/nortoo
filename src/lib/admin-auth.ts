import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

// ═══════════════════════════════════════════════════════════
// Admin Authentication — Separate from Auth.js (merchant auth)
// Uses ADMIN_SECRET env var + httpOnly cookie
// ═══════════════════════════════════════════════════════════

export const ADMIN_COOKIE_NAME = "nortoo_admin";

/**
 * Check if the current request is from an authenticated admin.
 *
 * Checks two sources:
 * 1. `nortoo_admin` httpOnly cookie (set at login)
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
    if (adminCookie?.value && safeCompare(adminCookie.value, secret)) {
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
