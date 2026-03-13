import { db } from "@/db/index";
import { merchants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { recordUsage } from "@/lib/quota";
import { updateProductStats } from "@/lib/product-stats";
import { updateCityStats } from "@/lib/city-stats";
import { updateZoneStats } from "@/lib/zone-stats";
import type { ScoringResult } from "@/lib/scoring";

/** Record usage counters + product/city/zone stats (all non-blocking) */
export async function recordMetrics(params: {
  merchantId: number;
  finalDecision: string;
  total: number;
  resolvedProductId?: string;
  productName?: string;
  productCategory?: string;
  shippingCity?: string;
  scoringResult: ScoringResult;
  parsedCity: string | null;
  parsedZone: string | null;
  parsedPostalCode: string | null;
}): Promise<void> {
  // Increment monthly order counter
  try {
    await db
      .update(merchants)
      .set({ currentMonthOrders: sql`${merchants.currentMonthOrders} + 1` })
      .where(eq(merchants.id, params.merchantId));
  } catch (err) {
    console.error("[Ingest] Monthly order counter increment failed (non-blocking):", err);
  }

  // Record usage in billing history
  try {
    await recordUsage(params.merchantId, params.finalDecision, params.total);
  } catch (err) {
    console.error("[Ingest] Usage recording failed (non-blocking):", err);
  }

  // Product stats
  try {
    if (params.resolvedProductId && params.productName) {
      await updateProductStats({
        merchantId: params.merchantId,
        productId: params.resolvedProductId,
        productName: params.productName,
        productCategory: params.productCategory,
        orderTotal: params.total,
      });
    }
  } catch (err) {
    console.error("[Ingest] Product stats update failed (non-blocking):", err);
  }

  // City stats
  try {
    if (params.shippingCity) {
      await updateCityStats({
        merchantId: params.merchantId,
        city: params.shippingCity,
        orderScore: params.scoringResult.score,
        orderTotal: params.total,
      });
    }
  } catch (err) {
    console.error("[Ingest] City stats update failed (non-blocking):", err);
  }

  // Zone stats
  try {
    if (params.parsedZone && params.parsedCity) {
      await updateZoneStats({
        merchantId: params.merchantId,
        city: params.parsedCity,
        zone: params.parsedZone,
        postalCode: params.parsedPostalCode ?? undefined,
        orderScore: params.scoringResult.score,
      });
    }
  } catch (err) {
    console.error("[Ingest] Zone stats update failed (non-blocking):", err);
  }
}
