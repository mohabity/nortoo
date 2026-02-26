/**
 * Server-side product event logger.
 * Fire-and-forget: calls are non-blocking (.catch(), never await).
 *
 * Usage:
 *   logProductEvent(merchantId, EVENTS.ORDER_SCORED, { score: 72 });
 */

import { db } from "@/db/index";
import { productEvents } from "@/db/schema";

/** All tracked product events */
export const EVENTS = {
  ORDER_SCORED: "order_scored",
  ORDER_OVERRIDDEN: "order_overridden",
  MERCHANT_SIGNUP: "merchant_signup",
  SCORING_CONFIG_CHANGED: "scoring_config_changed",
  PDF_EXPORTED: "pdf_exported",
  CSV_EXPORTED: "csv_exported",
  DATA_RIGHTS_REQUEST: "data_rights_request",
  PLAN_UPGRADED: "plan_upgraded",
  WEBHOOK_RECEIVED: "webhook_received",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Log a product event (fire-and-forget).
 * Never throws — errors are silently logged to console.
 */
export function logProductEvent(
  merchantId: number,
  eventName: EventName,
  eventData?: Record<string, unknown>,
  userId?: number
): void {
  db.insert(productEvents)
    .values({
      merchantId,
      userId: userId ?? null,
      eventName,
      eventData: eventData ? JSON.stringify(eventData) : null,
    })
    .catch((err) =>
      console.error("[analytics-server] Failed to log event:", eventName, err)
    );
}
