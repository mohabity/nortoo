/**
 * Zone Stats — Quartier-Level Geographic Risk Tracking
 * Tracks per-zone (quartier) delivery statistics for data-driven geo scoring.
 * Follows the exact same pattern as city-stats.ts.
 */

import { db } from "@/db/index";
import { zoneStats, orders } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// NORMALIZATION
// ═══════════════════════════════════════════════════════════

/**
 * Normalize a zone (quartier) name: lowercase, trim, remove diacritics.
 */
export function normalizeZone(rawZone: string): string {
  return rawZone
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s+/g, " ");           // collapse whitespace
}

/**
 * Capitalize a normalized zone name for UI display.
 * "sidi moumen" → "Sidi Moumen"
 * "hay el baraka" → "Hay El Baraka"
 */
export function displayZone(normalizedZone: string): string {
  return normalizedZone
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(normalizedZone.includes("-") ? "-" : " ");
}

/**
 * Compute risk tier from RTO rate and sample size (zone-level).
 * More conservative thresholds — zones have smaller sample sizes.
 */
export function computeZoneRiskTier(
  rtoRate: number,
  totalOrders: number
): "safe" | "moderate" | "risky" | "dangerous" | "unknown" {
  if (totalOrders < 5) return "unknown";
  if (rtoRate > 0.40) return "dangerous";
  if (rtoRate > 0.25) return "risky";
  if (rtoRate > 0.15) return "moderate";
  return "safe";
}

// ═══════════════════════════════════════════════════════════
// UPSERT — called after each order insert (incremental)
// ═══════════════════════════════════════════════════════════

export async function updateZoneStats(params: {
  merchantId: number;
  city: string;      // already normalized
  zone: string;      // already normalized
  postalCode?: string;
  orderScore: number;
}): Promise<void> {
  const { merchantId, city, zone, postalCode, orderScore } = params;

  await db
    .insert(zoneStats)
    .values({
      merchantId,
      city,
      zone,
      postalCode: postalCode ?? null,
      totalOrders: 1,
      avgScore: orderScore,
      lastOrderAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [zoneStats.merchantId, zoneStats.city, zoneStats.zone],
      set: {
        totalOrders: sql`${zoneStats.totalOrders} + 1`,
        avgScore: sql`(${zoneStats.avgScore} * ${zoneStats.totalOrders} + ${orderScore}) / (${zoneStats.totalOrders} + 1)`,
        postalCode: postalCode ?? sql`${zoneStats.postalCode}`, // update if provided
        lastOrderAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

// ═══════════════════════════════════════════════════════════
// LOOKUP — called before scoring (merchant-level)
// ═══════════════════════════════════════════════════════════

export async function getZoneStats(
  merchantId: number,
  city: string,
  zone: string
): Promise<{ rtoRate: number; totalOrders: number; avgScore: number } | null> {
  const [row] = await db
    .select({
      rtoRate: zoneStats.rtoRate,
      totalOrders: zoneStats.totalOrders,
      avgScore: zoneStats.avgScore,
    })
    .from(zoneStats)
    .where(
      and(
        eq(zoneStats.merchantId, merchantId),
        eq(zoneStats.city, city),
        eq(zoneStats.zone, zone)
      )
    )
    .limit(1);

  if (!row) return null;
  return { rtoRate: row.rtoRate, totalOrders: row.totalOrders, avgScore: row.avgScore ?? 0 };
}

// ═══════════════════════════════════════════════════════════
// GLOBAL LOOKUP — cross-merchant aggregation (fallback)
// ═══════════════════════════════════════════════════════════

/**
 * Global zone stats across ALL merchants.
 * Used as fallback when a merchant has insufficient zone data.
 * Minimum 20 total orders for statistical significance.
 */
export async function getGlobalZoneStats(
  city: string,
  zone: string
): Promise<{ rtoRate: number; totalOrders: number } | null> {
  const [row] = await db
    .select({
      totalOrders: sql<number>`coalesce(sum(${zoneStats.totalOrders}), 0)::int`,
      deliveredOrders: sql<number>`coalesce(sum(${zoneStats.deliveredOrders}), 0)::int`,
      returnedOrders: sql<number>`coalesce(sum(${zoneStats.returnedOrders}), 0)::int`,
    })
    .from(zoneStats)
    .where(
      and(
        eq(zoneStats.city, city),
        eq(zoneStats.zone, zone)
      )
    );

  if (!row || row.totalOrders < 20) return null;

  const terminal = row.deliveredOrders + row.returnedOrders;
  const rtoRate = terminal > 0 ? row.returnedOrders / terminal : 0;

  return { rtoRate, totalOrders: row.totalOrders };
}

// ═══════════════════════════════════════════════════════════
// FULL RECALCULATION — called by daily cron
// ═══════════════════════════════════════════════════════════

/**
 * Recalculate all zone stats from orders table.
 * Groups by parsedCity + parsedZone WHERE both are NOT NULL.
 * Returns the number of zones updated.
 */
export async function recalculateAllZoneStats(merchantId: number): Promise<number> {
  const zoneAggregates = await db
    .select({
      parsedCity: orders.parsedCity,
      parsedZone: orders.parsedZone,
      totalOrders: sql<number>`count(*)::int`,
      deliveredOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')::int`,
      returnedOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'returned')::int`,
      blockedOrders: sql<number>`count(*) filter (where ${orders.decision} = 'block')::int`,
      avgScore: sql<number>`coalesce(avg(${orders.fraudScore}), 0)::real`,
      lastOrderAt: sql<string | null>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        sql`${orders.parsedCity} is not null`,
        sql`${orders.parsedZone} is not null`
      )
    )
    .groupBy(orders.parsedCity, orders.parsedZone);

  let updated = 0;

  for (const agg of zoneAggregates) {
    if (!agg.parsedCity || !agg.parsedZone) continue;

    const terminal = agg.deliveredOrders + agg.returnedOrders;
    const rtoRate = terminal > 0 ? agg.returnedOrders / terminal : 0;

    await db
      .insert(zoneStats)
      .values({
        merchantId,
        city: agg.parsedCity,
        zone: agg.parsedZone,
        totalOrders: agg.totalOrders,
        deliveredOrders: agg.deliveredOrders,
        returnedOrders: agg.returnedOrders,
        blockedOrders: agg.blockedOrders,
        rtoRate,
        avgScore: agg.avgScore,
        lastOrderAt: agg.lastOrderAt ? new Date(agg.lastOrderAt) : null,
      })
      .onConflictDoUpdate({
        target: [zoneStats.merchantId, zoneStats.city, zoneStats.zone],
        set: {
          totalOrders: agg.totalOrders,
          deliveredOrders: agg.deliveredOrders,
          returnedOrders: agg.returnedOrders,
          blockedOrders: agg.blockedOrders,
          rtoRate,
          avgScore: agg.avgScore,
          lastOrderAt: agg.lastOrderAt ? new Date(agg.lastOrderAt) : null,
          updatedAt: new Date(),
        },
      });

    updated++;
  }

  return updated;
}
