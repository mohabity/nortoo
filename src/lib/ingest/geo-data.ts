import { normalizeCity, getCityRiskData, getGlobalCityStats } from "@/lib/city-stats";
import { getProductRtoRate } from "@/lib/product-stats";
import { parseAddress } from "@/lib/address-parser";
import { getZoneStats, getGlobalZoneStats } from "@/lib/zone-stats";
import type { GeoData } from "./types";

/** Gather product, city, and zone risk data for scoring */
export async function gatherGeoData(
  merchantId: number,
  resolvedProductId: string | undefined,
  shippingCity: string | undefined,
  shippingAddress: string | undefined,
): Promise<GeoData> {
  const result: GeoData = {
    parsedCity: null,
    parsedZone: null,
    parsedPostalCode: null,
    addressConfidence: null,
  };

  // Product stats
  if (resolvedProductId) {
    try {
      const productData = await getProductRtoRate(merchantId, resolvedProductId);
      if (productData) {
        result.productRtoRate = productData.rtoRate;
        result.productTotalOrders = productData.totalOrders;
      }
    } catch (err) {
      console.error("[Ingest] Product stats lookup failed (non-blocking):", err);
    }
  }

  // City stats
  if (shippingCity) {
    try {
      const normalized = normalizeCity(shippingCity);
      const cityData = await getCityRiskData(merchantId, normalized);
      if (cityData) {
        result.cityRtoRate = cityData.rtoRate;
        result.cityRiskTier = cityData.riskTier;
        result.cityTotalOrders = cityData.totalOrders;
      }
      // Fallback to global stats if merchant has insufficient data
      if (!cityData || cityData.totalOrders < 10) {
        const globalData = await getGlobalCityStats(normalized);
        if (globalData && (!cityData || globalData.totalOrders > cityData.totalOrders)) {
          result.cityRtoRate = globalData.rtoRate;
          result.cityTotalOrders = globalData.totalOrders;
          if (globalData.totalOrders < 5) result.cityRiskTier = "unknown";
          else if (globalData.rtoRate > 0.40) result.cityRiskTier = "dangerous";
          else if (globalData.rtoRate > 0.25) result.cityRiskTier = "risky";
          else if (globalData.rtoRate > 0.15) result.cityRiskTier = "moderate";
          else result.cityRiskTier = "safe";
        }
      }
    } catch (err) {
      console.error("[Ingest] City stats lookup failed (non-blocking):", err);
    }
  }

  // Address parsing + zone stats
  if (shippingAddress) {
    try {
      const parsed = parseAddress(shippingAddress);
      result.parsedCity = parsed.city;
      result.parsedZone = parsed.zone;
      result.parsedPostalCode = parsed.postalCode;
      result.addressConfidence = parsed.confidence;

      if (parsed.zone && parsed.city) {
        const merchantZone = await getZoneStats(merchantId, parsed.city, parsed.zone);
        if (merchantZone && merchantZone.totalOrders >= 5) {
          result.zoneRtoRate = merchantZone.rtoRate;
          result.zoneTotalOrders = merchantZone.totalOrders;
          result.zoneDataSource = "merchant";
        }
        if (!merchantZone || merchantZone.totalOrders < 10) {
          const globalZone = await getGlobalZoneStats(parsed.city, parsed.zone);
          if (globalZone && (!merchantZone || globalZone.totalOrders > merchantZone.totalOrders)) {
            result.zoneRtoRate = globalZone.rtoRate;
            result.zoneTotalOrders = globalZone.totalOrders;
            result.zoneDataSource = "network";
          }
        }
      }
    } catch (err) {
      console.error("[Ingest] Address parsing / zone lookup failed (non-blocking):", err);
    }
  }

  return result;
}
