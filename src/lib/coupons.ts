/**
 * Coupon system — validate & redeem promotional codes
 *
 * Two coupon types:
 * - trial_extension: Adds X days to the merchant's trial period
 * - first_month_free: Upgrades to a paid plan with 1st month free (invoice marked paid)
 */

import { db } from "@/db/index";
import {
  coupons,
  couponRedemptions,
  merchants,
  invoices,
  auditLogs,
} from "@/db/schema";
import { eq, and, or, isNull, gt, sql, count } from "drizzle-orm";
import { getPlanConfig, type PlanId } from "@/lib/plans";
import {
  calculateAmounts,
  generateInvoiceNumber,
} from "@/lib/billing-config";

// ── Types ────────────────────────────────────────────────

export type CouponType = "trial_extension" | "first_month_free";

export interface ValidatedCoupon {
  id: number;
  code: string;
  type: CouponType;
  value: string;
  description: string;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  effect?: string;
}

// ── validateCoupon ───────────────────────────────────────

/**
 * Validate a coupon code: checks existence, active, not expired, uses remaining.
 * Does NOT check merchant-specific redemption (that's in redeemCoupon).
 */
export async function validateCoupon(
  code: string
): Promise<ValidatedCoupon | null> {
  const normalized = code.trim().toUpperCase();
  const now = new Date();

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.code, normalized),
        eq(coupons.isActive, true),
        or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now))
      )
    )
    .limit(1);

  if (!coupon) return null;

  // Check max uses
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return null;
  }

  const description =
    coupon.type === "trial_extension"
      ? `Prolonge votre essai de ${coupon.value} jours`
      : `Premier mois gratuit sur le plan ${getPlanConfig(coupon.value as PlanId).name}`;

  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type as CouponType,
    value: coupon.value,
    description,
  };
}

// ── redeemCoupon ─────────────────────────────────────────

/**
 * Redeem a coupon for a merchant.
 * Applies the effect (extend trial or activate first month free).
 */
export async function redeemCoupon(
  merchantId: number,
  couponCode: string,
  userId?: number | null
): Promise<RedeemResult> {
  // Validate coupon
  const coupon = await validateCoupon(couponCode);
  if (!coupon) {
    return { success: false, message: "Code promo invalide ou expiré." };
  }

  // Check if already redeemed by this merchant
  const [existing] = await db
    .select({ id: couponRedemptions.id })
    .from(couponRedemptions)
    .where(
      and(
        eq(couponRedemptions.couponId, coupon.id),
        eq(couponRedemptions.merchantId, merchantId)
      )
    )
    .limit(1);

  if (existing) {
    return { success: false, message: "Vous avez déjà utilisé ce code promo." };
  }

  // ── Apply effect ──

  let effect: Record<string, unknown>;

  if (coupon.type === "trial_extension") {
    const days = parseInt(coupon.value, 10);
    if (isNaN(days) || days <= 0) {
      return { success: false, message: "Configuration du coupon invalide." };
    }

    // Fetch current trial end
    const [m] = await db
      .select({
        trialEndsAt: merchants.trialEndsAt,
        billingStatus: merchants.billingStatus,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!m) return { success: false, message: "Marchand introuvable." };

    // Calculate new trial end: from now or from existing trialEndsAt (whichever is later)
    const baseDate =
      m.trialEndsAt && new Date(m.trialEndsAt) > new Date()
        ? new Date(m.trialEndsAt)
        : new Date();
    const newTrialEnd = new Date(
      baseDate.getTime() + days * 24 * 60 * 60 * 1000
    );

    await db
      .update(merchants)
      .set({
        trialEndsAt: newTrialEnd,
        billingStatus: "trial", // Reactivate if was past_due
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));

    effect = {
      type: "trial_extension",
      days,
      previousTrialEndsAt: m.trialEndsAt?.toISOString() ?? null,
      newTrialEndsAt: newTrialEnd.toISOString(),
      previousBillingStatus: m.billingStatus,
      newBillingStatus: "trial",
    };
  } else if (coupon.type === "first_month_free") {
    const planId = coupon.value as PlanId;
    const planConfig = getPlanConfig(planId);

    if (planConfig.id === "trial") {
      return { success: false, message: "Configuration du coupon invalide." };
    }

    // Upgrade merchant to the plan
    await db
      .update(merchants)
      .set({
        plan: planId,
        billingStatus: "active",
        trialEndsAt: null,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId));

    // Create a paid invoice with coupon note
    const priceHT = planConfig.price * 100; // DH to centimes
    const amounts = calculateAmounts(priceHT);
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Generate sequential invoice number
    const [countResult] = await db.select({ cnt: count() }).from(invoices);
    const sequence = Number(countResult.cnt) + 1;
    const invoiceNumber = generateInvoiceNumber(sequence);

    await db.insert(invoices).values({
      merchantId,
      invoiceNumber,
      period,
      planAtInvoice: planId,
      amountHT: amounts.amountHT,
      tvaRate: 20,
      amountTVA: amounts.amountTVA,
      amountTTC: amounts.amountTTC,
      status: "paid",
      paidAt: now,
      paidNote: `Coupon: ${coupon.code} (premier mois gratuit)`,
      dueDate: now,
    });

    effect = {
      type: "first_month_free",
      plan: planId,
      planName: planConfig.name,
      invoiceNumber,
      amountTTC: amounts.amountTTC,
    };
  } else {
    return { success: false, message: "Type de coupon non reconnu." };
  }

  // ── Record redemption ──

  await db.insert(couponRedemptions).values({
    couponId: coupon.id,
    merchantId,
    effect: JSON.stringify(effect),
  });

  // Increment used count (SQL increment for concurrency safety)
  await db
    .update(coupons)
    .set({
      usedCount: sql`${coupons.usedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, coupon.id));

  // ── Audit log (Art. 23) ──

  await db.insert(auditLogs).values({
    merchantId,
    userId: userId ?? undefined,
    actor: "merchant",
    action: "coupon_redeemed",
    targetType: "merchant",
    targetId: String(merchantId),
    details: JSON.stringify({
      couponCode: coupon.code,
      couponType: coupon.type,
      effect,
    }),
  });

  // ── Success message ──

  const message =
    coupon.type === "trial_extension"
      ? `Essai prolongé de ${coupon.value} jours !`
      : `Premier mois gratuit sur le plan ${getPlanConfig(coupon.value as PlanId).name} activé !`;

  return { success: true, message, effect: JSON.stringify(effect) };
}
