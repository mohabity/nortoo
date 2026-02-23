/**
 * Quota enforcement — checkQuota + recordUsage
 *
 * Central module for billing enforcement:
 * - checkQuota() → is this merchant allowed to process another order?
 * - recordUsage() → upsert monthly usage stats into usageLogs
 * - QuotaExceededError → typed error thrown when quota is exceeded
 */

import { db } from "@/db/index";
import { merchants, usageLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getOrderLimit, isTrialExpired, trialDaysRemaining } from "@/lib/plans";

// ── Types ────────────────────────────────────────────────

export type QuotaReason =
  | "trial_expired"
  | "billing_inactive"
  | "quota_exceeded";

export interface QuotaCheck {
  allowed: boolean;
  current: number;
  limit: number; // 0 = unlimited
  plan: string;
  reason?: QuotaReason;
  daysRemaining?: number;
}

// ── QuotaExceededError ───────────────────────────────────

export class QuotaExceededError extends Error {
  public readonly quota: QuotaCheck;

  constructor(reason: QuotaReason | undefined, quota: QuotaCheck) {
    super(`Quota exceeded: ${reason ?? "unknown"}`);
    this.name = "QuotaExceededError";
    this.quota = quota;
  }
}

// ── checkQuota ───────────────────────────────────────────

/**
 * Check if a merchant is allowed to process another order.
 *
 * Checks in order:
 * 1. Trial expired? → blocked
 * 2. Billing inactive (past_due / cancelled)? → blocked
 * 3. Monthly quota exceeded? → blocked
 *
 * Also auto-resets the monthly counter if a new month has started.
 */
export async function checkQuota(merchantId: number): Promise<QuotaCheck> {
  const [m] = await db
    .select({
      plan: merchants.plan,
      billingStatus: merchants.billingStatus,
      trialEndsAt: merchants.trialEndsAt,
      currentMonthOrders: merchants.currentMonthOrders,
      currentMonthStart: merchants.currentMonthStart,
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1);

  if (!m) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      plan: "trial",
      reason: "billing_inactive",
    };
  }

  const limit = getOrderLimit(m.plan);
  const current = m.currentMonthOrders;

  // ── Auto-reset if new month ──
  if (m.currentMonthStart) {
    const startMonth = new Date(m.currentMonthStart);
    const now = new Date();
    if (
      startMonth.getMonth() !== now.getMonth() ||
      startMonth.getFullYear() !== now.getFullYear()
    ) {
      await db
        .update(merchants)
        .set({
          currentMonthOrders: 0,
          currentMonthStart: now,
        })
        .where(eq(merchants.id, merchantId));

      // After reset, current is 0 — continue with checks below using 0
      return checkQuotaInternal(m.plan, m.billingStatus, m.trialEndsAt, 0, limit);
    }
  }

  return checkQuotaInternal(m.plan, m.billingStatus, m.trialEndsAt, current, limit);
}

function checkQuotaInternal(
  plan: string,
  billingStatus: string,
  trialEndsAt: Date | null,
  current: number,
  limit: number
): QuotaCheck {
  const days = trialDaysRemaining(trialEndsAt);

  // 1. Trial expired?
  if (billingStatus === "trial" && isTrialExpired(trialEndsAt)) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      reason: "trial_expired",
      daysRemaining: 0,
    };
  }

  // 2. Billing inactive?
  if (billingStatus === "past_due" || billingStatus === "cancelled") {
    return {
      allowed: false,
      current,
      limit,
      plan,
      reason: "billing_inactive",
      daysRemaining: days > 0 ? days : undefined,
    };
  }

  // 3. Quota exceeded? (0 = unlimited)
  if (limit > 0 && current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      reason: "quota_exceeded",
      daysRemaining: days > 0 ? days : undefined,
    };
  }

  // All good
  return {
    allowed: true,
    current,
    limit,
    plan,
    daysRemaining: days > 0 ? days : undefined,
  };
}

// ── recordUsage ──────────────────────────────────────────

/**
 * Record order processing in monthly usage logs.
 * Upserts the current month's row in usageLogs.
 */
export async function recordUsage(
  merchantId: number,
  decision: string,
  total: number
): Promise<void> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const isBlocked = decision === "block";

  await db
    .insert(usageLogs)
    .values({
      merchantId,
      month,
      ordersScored: 1,
      ordersBlocked: isBlocked ? 1 : 0,
      totalValue: total,
      blockedValue: isBlocked ? total : 0,
    })
    .onConflictDoUpdate({
      target: [usageLogs.merchantId, usageLogs.month],
      set: {
        ordersScored: sql`${usageLogs.ordersScored} + 1`,
        ordersBlocked: isBlocked
          ? sql`${usageLogs.ordersBlocked} + 1`
          : usageLogs.ordersBlocked,
        totalValue: sql`${usageLogs.totalValue} + ${total}`,
        blockedValue: isBlocked
          ? sql`${usageLogs.blockedValue} + ${total}`
          : usageLogs.blockedValue,
        updatedAt: now,
      },
    });
}
