/**
 * City Stats — Dynamic Geographic Risk Tracking
 * Tracks per-city delivery statistics for data-driven geo scoring.
 * Normalizes Moroccan city names with alias resolution.
 */

import { db } from "@/db/index";
import { cityStats, orders } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════
// MOROCCAN CITY ALIASES
// Handles Darija, French, and common misspellings
// ═══════════════════════════════════════════════════════════

const CITY_ALIASES: Record<string, string> = {
  // Casablanca variants
  "casa": "casablanca",
  "casa blanca": "casablanca",
  "dar el beida": "casablanca",
  "dar el bayda": "casablanca",
  "dar lbeida": "casablanca",
  // Rabat
  "rbat": "rabat",
  // Marrakech
  "mrkch": "marrakech",
  "marrakesh": "marrakech",
  "marakech": "marrakech",
  // Fès
  "fes": "fes",
  "fez": "fes",
  // Tanger
  "tanja": "tanger",
  "tangier": "tanger",
  "tangiers": "tanger",
  // Tétouan
  "tetouan": "tetouan",
  // Meknès
  "meknes": "meknes",
  // Kénitra
  "kenitra": "kenitra",
  // Salé
  "sale": "sale",
  // Témara
  "temara": "temara",
  // El Jadida
  "el jadida": "el jadida",
  "eljadida": "el jadida",
  "el-jadida": "el jadida",
  // Béni Mellal
  "beni mellal": "beni mellal",
  "beni-mellal": "beni mellal",
  // Laâyoune
  "laayoune": "laayoune",
  // Mohammedia
  "mohammedia": "mohammedia",
  // Guelmim
  "guelmim": "guelmim",
  "goulmima": "guelmim",
  // Tan-Tan
  "tantan": "tan-tan",
  "tan tan": "tan-tan",
  // Errachidia
  "errachidiya": "errachidia",
  // Sidi Slimane
  "sidi sliman": "sidi slimane",
  // Nador
  "nador": "nador",
  // Berrechid
  "berrechid": "berrechid",
  // Settat
  "settat": "settat",
  // Safi
  "safi": "safi",
  // Khemisset
  "khemisset": "khemisset",
  // Taza
  "taza": "taza",
  // Ouarzazate
  "ouarzazat": "ouarzazate",
  "ouarzazate": "ouarzazate",
  // Khouribga
  "khouribga": "khouribga",
  // Oujda
  "oujda": "oujda",
  // Agadir
  "agadir": "agadir",
  // Dakhla
  "dakhla": "dakhla",
};

// ═══════════════════════════════════════════════════════════
// NORMALIZATION
// ═══════════════════════════════════════════════════════════

/**
 * Normalize a city name: lowercase, trim, remove diacritics, resolve aliases.
 */
export function normalizeCity(rawCity: string): string {
  const cleaned = rawCity
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s+/g, " ");           // collapse whitespace

  return CITY_ALIASES[cleaned] ?? cleaned;
}

/**
 * Capitalize a normalized city name for UI display.
 * "sidi slimane" → "Sidi Slimane"
 */
export function displayCity(normalizedCity: string): string {
  return normalizedCity
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(normalizedCity.includes("-") ? "-" : " ");
}

/**
 * Compute risk tier from RTO rate and sample size.
 */
export function computeRiskTier(
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
// UPSERT — called after each order insert
// ═══════════════════════════════════════════════════════════

export async function updateCityStats(params: {
  merchantId: number;
  city: string;
  orderScore: number;
  orderTotal: number;
}): Promise<void> {
  const { merchantId, city, orderScore, orderTotal } = params;
  const normalized = normalizeCity(city);
  const display = displayCity(normalized);

  await db
    .insert(cityStats)
    .values({
      merchantId,
      cityNormalized: normalized,
      cityDisplay: display,
      totalOrders: 1,
      avgScore: orderScore,
      avgOrderValue: orderTotal,
      lastOrderAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [cityStats.merchantId, cityStats.cityNormalized],
      set: {
        totalOrders: sql`${cityStats.totalOrders} + 1`,
        avgScore: sql`(${cityStats.avgScore} * ${cityStats.totalOrders} + ${orderScore}) / (${cityStats.totalOrders} + 1)`,
        avgOrderValue: sql`(${cityStats.avgOrderValue} * ${cityStats.totalOrders} + ${orderTotal}) / (${cityStats.totalOrders} + 1)`,
        cityDisplay: display,
        lastOrderAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

// ═══════════════════════════════════════════════════════════
// LOOKUP — called before scoring
// ═══════════════════════════════════════════════════════════

export async function getCityRiskData(
  merchantId: number,
  normalizedCity: string
): Promise<{ rtoRate: number; riskTier: string; totalOrders: number } | null> {
  const [row] = await db
    .select({
      rtoRate: cityStats.rtoRate,
      riskTier: cityStats.riskTier,
      totalOrders: cityStats.totalOrders,
    })
    .from(cityStats)
    .where(
      and(
        eq(cityStats.merchantId, merchantId),
        eq(cityStats.cityNormalized, normalizedCity)
      )
    )
    .limit(1);

  return row ?? null;
}

/**
 * Global city stats across ALL merchants.
 * Used as fallback when a merchant has < 10 orders to a city.
 * This is the "Network Intelligence" concept from the roadmap.
 */
export async function getGlobalCityStats(
  normalizedCity: string
): Promise<{ rtoRate: number; totalOrders: number } | null> {
  const [row] = await db
    .select({
      totalOrders: sql<number>`coalesce(sum(${cityStats.totalOrders}), 0)::int`,
      deliveredOrders: sql<number>`coalesce(sum(${cityStats.deliveredOrders}), 0)::int`,
      returnedOrders: sql<number>`coalesce(sum(${cityStats.returnedOrders}), 0)::int`,
    })
    .from(cityStats)
    .where(eq(cityStats.cityNormalized, normalizedCity));

  if (!row || row.totalOrders < 20) return null;

  const terminal = row.deliveredOrders + row.returnedOrders;
  const rtoRate = terminal > 0 ? row.returnedOrders / terminal : 0;

  return { rtoRate, totalOrders: row.totalOrders };
}

// ═══════════════════════════════════════════════════════════
// FULL RECALCULATION — called by daily cron
// ═══════════════════════════════════════════════════════════

export async function recalculateAllCityStats(merchantId: number): Promise<number> {
  const cityAggregates = await db
    .select({
      shippingCity: orders.shippingCity,
      totalOrders: sql<number>`count(*)::int`,
      deliveredOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'delivered')::int`,
      returnedOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'returned')::int`,
      cancelledOrders: sql<number>`count(*) filter (where ${orders.deliveryStatus} = 'cancelled')::int`,
      avgScore: sql<number>`coalesce(avg(${orders.fraudScore}), 0)::real`,
      avgOrderValue: sql<number>`coalesce(avg(${orders.total}), 0)::real`,
      lastOrderAt: sql<Date>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        sql`${orders.shippingCity} is not null`
      )
    )
    .groupBy(orders.shippingCity);

  let updated = 0;

  for (const agg of cityAggregates) {
    if (!agg.shippingCity) continue;

    const normalized = normalizeCity(agg.shippingCity);
    const display = displayCity(normalized);
    const terminal = agg.deliveredOrders + agg.returnedOrders;
    const rtoRate = terminal > 0 ? agg.returnedOrders / terminal : 0;
    const riskTier = computeRiskTier(rtoRate, agg.totalOrders);

    await db
      .insert(cityStats)
      .values({
        merchantId,
        cityNormalized: normalized,
        cityDisplay: display,
        totalOrders: agg.totalOrders,
        deliveredOrders: agg.deliveredOrders,
        returnedOrders: agg.returnedOrders,
        cancelledOrders: agg.cancelledOrders,
        rtoRate,
        avgScore: agg.avgScore,
        avgOrderValue: agg.avgOrderValue,
        riskTier,
        lastOrderAt: agg.lastOrderAt,
      })
      .onConflictDoUpdate({
        target: [cityStats.merchantId, cityStats.cityNormalized],
        set: {
          cityDisplay: display,
          totalOrders: agg.totalOrders,
          deliveredOrders: agg.deliveredOrders,
          returnedOrders: agg.returnedOrders,
          cancelledOrders: agg.cancelledOrders,
          rtoRate,
          avgScore: agg.avgScore,
          avgOrderValue: agg.avgOrderValue,
          riskTier,
          lastOrderAt: agg.lastOrderAt,
          updatedAt: new Date(),
        },
      });

    updated++;
  }

  return updated;
}
