/**
 * Notification Helper — Check merchant preferences before creating notifications.
 *
 * Usage:
 *   const allowed = await shouldNotify(merchantId, "order_auto_blocked");
 *   if (allowed) { db.insert(notifications).values(...); }
 */

import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq } from "drizzle-orm";

// Notification types that can be toggled via preferences
const PREFERENCE_MAP: Record<string, string> = {
  order_auto_blocked: "order_auto_blocked",
  order_needs_review: "order_needs_review",
  order_flagged: "order_flagged",
  escalation: "escalation",
  daily_summary: "daily_summary",
  weekly_report: "weekly_report",
  webhook_failed: "webhook_failed",
};

// Types that are ALWAYS sent regardless of preferences
const ALWAYS_SEND = new Set([
  "webhook_silent",
  "webhook_dead",
  "order_auto_shipped", // informational, always useful
]);

interface EmailPrefs {
  order_auto_blocked?: boolean;
  order_needs_review?: boolean;
  order_flagged?: boolean;
  escalation?: boolean;
  daily_summary?: boolean;
  weekly_report?: boolean;
  webhook_failed?: boolean;
}

/**
 * Check if a notification should be created for a given merchant + type.
 * Returns true if the merchant has not disabled this notification type.
 * Always returns true for critical system notifications (webhook_silent, webhook_dead).
 */
export async function shouldNotify(
  merchantId: number,
  type: string
): Promise<boolean> {
  // Always send critical system notifications
  if (ALWAYS_SEND.has(type)) return true;

  // If type isn't in the preference map, default to sending
  const prefKey = PREFERENCE_MAP[type];
  if (!prefKey) return true;

  try {
    const [merchant] = await db
      .select({ notificationPreferences: merchants.notificationPreferences })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant?.notificationPreferences) return true; // No prefs = all enabled

    const parsed =
      typeof merchant.notificationPreferences === "string"
        ? JSON.parse(merchant.notificationPreferences)
        : merchant.notificationPreferences;

    const emailPrefs: EmailPrefs = parsed?.email ?? {};
    const value = emailPrefs[prefKey as keyof EmailPrefs];

    // undefined = not set = default enabled
    return value !== false;
  } catch {
    // If we can't read prefs, default to sending (fail-open)
    return true;
  }
}
