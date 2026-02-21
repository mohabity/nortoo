/**
 * Verify the CRON_SECRET for cron job authentication.
 * - In production/preview: CRON_SECRET is required
 * - In development: allows through if CRON_SECRET is not set (with warning)
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[CRON] CRON_SECRET not set — allowing in development mode");
      return true;
    }
    console.error("[CRON] CRON_SECRET env var is missing!");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
