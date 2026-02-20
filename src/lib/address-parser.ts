/**
 * Address Parser for Moroccan addresses
 * Pure synchronous function — no DB calls.
 * Extracts: city, zone (quartier), postal code, and confidence score.
 */

import { KNOWN_ZONES, POSTAL_CODE_TO_CITY, ZONE_ALIASES, ZONE_PREFIXES } from "./morocco-zones";
import { CITY_ALIASES, normalizeCity } from "./city-stats";

// ═══════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ═══════════════════════════════════════════════════════════

export interface ParsedAddress {
  city: string | null;
  zone: string | null;
  postalCode: string | null;
  confidence: number; // 0.0–1.0
}

const EMPTY_RESULT: ParsedAddress = {
  city: null,
  zone: null,
  postalCode: null,
  confidence: 0,
};

// ═══════════════════════════════════════════════════════════
// INTERNAL — pre-compute lookup sets
// ═══════════════════════════════════════════════════════════

/** All city names we can detect (alias keys + KNOWN_ZONES keys) sorted by length DESC */
const ALL_CITY_KEYS: string[] = [
  ...Object.keys(CITY_ALIASES),
  ...Object.keys(KNOWN_ZONES),
].sort((a, b) => b.length - a.length); // longest match first

/** Pre-compute flattened zone-to-city lookup for zone-only detection */
const ZONE_TO_CITY: Map<string, string> = new Map();
for (const [city, zones] of Object.entries(KNOWN_ZONES)) {
  for (const zone of zones) {
    // Only map unique zones (some like "medina" exist in multiple cities)
    if (!ZONE_TO_CITY.has(zone)) {
      ZONE_TO_CITY.set(zone, city);
    } else {
      // If zone exists in multiple cities, remove it (ambiguous)
      ZONE_TO_CITY.set(zone, "__ambiguous__");
    }
  }
}

// Build per-city zone lists sorted by length DESC for matching
const ZONES_BY_CITY_SORTED: Map<string, string[]> = new Map();
for (const [city, zones] of Object.entries(KNOWN_ZONES)) {
  ZONES_BY_CITY_SORTED.set(
    city,
    [...zones].sort((a, b) => b.length - a.length)
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PARSER
// ═══════════════════════════════════════════════════════════

export function parseAddress(raw: string | null | undefined): ParsedAddress {
  if (!raw || typeof raw !== "string") return EMPTY_RESULT;

  const cleaned = cleanAddress(raw);
  if (cleaned.length < 3) return EMPTY_RESULT;

  let city: string | null = null;
  let zone: string | null = null;
  let postalCode: string | null = null;
  let confidence = 0;

  // ── Step 1: Extract postal code ──
  postalCode = extractPostalCode(cleaned);
  if (postalCode) {
    confidence += 0.2;
  }

  // ── Step 2: Extract city ──
  city = extractCity(cleaned);

  // If no city found from text, try postal code mapping
  if (!city && postalCode) {
    const prefix = postalCode.slice(0, 2);
    const mapped = POSTAL_CODE_TO_CITY[prefix];
    if (mapped) {
      city = mapped;
    }
  }

  if (city) {
    confidence += 0.3;
  }

  // ── Step 3: Extract zone (quartier) ──
  zone = extractZone(cleaned, city);

  // If zone found but no city, try reverse-lookup
  if (zone && !city) {
    const mappedCity = ZONE_TO_CITY.get(zone);
    if (mappedCity && mappedCity !== "__ambiguous__") {
      city = mappedCity;
      confidence += 0.3; // city was inferred from zone
    }
  }

  if (zone) {
    confidence += 0.3;
  }

  // ── Step 4: Bonus confidence ──
  if (cleaned.length >= 30) confidence += 0.1;
  if (/\d+/.test(cleaned)) confidence += 0.1;

  confidence = Math.min(confidence, 1.0);
  confidence = Math.round(confidence * 100) / 100; // round to 2 decimals

  return { city, zone, postalCode, confidence };
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function cleanAddress(raw: string): string {
  let s = raw.trim().toLowerCase();

  // Remove diacritics (keep base characters)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Remove common prefixes
  s = s.replace(/^(adresse\s*:|adr\s*:|livraison\s*:|addr\s*:)\s*/i, "");

  // Keep letters, numbers, spaces, commas, dots, hyphens
  s = s.replace(/[^a-z0-9\s,.\-']/g, " ");

  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

function extractPostalCode(cleaned: string): string | null {
  const match = cleaned.match(/\b(\d{5})\b/);
  if (match) {
    const code = match[1];
    const num = parseInt(code, 10);
    // Valid Moroccan postal codes: 10000-99999
    if (num >= 10000 && num <= 99999) {
      return code;
    }
  }
  return null;
}

function extractCity(cleaned: string): string | null {
  // Try each city key (sorted longest first to avoid partial matches)
  for (const key of ALL_CITY_KEYS) {
    // Word boundary matching: the key must be surrounded by non-alpha or string edges
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,.-])${escaped}(?:[\\s,.-]|$)`);

    if (regex.test(cleaned)) {
      // Resolve through normalizeCity to get canonical name
      return normalizeCity(key);
    }
  }
  return null;
}

function extractZone(cleaned: string, city: string | null): string | null {
  // Strategy 1: Match known zones for the detected city
  if (city) {
    const cityZones = ZONES_BY_CITY_SORTED.get(city);
    if (cityZones) {
      for (const zoneName of cityZones) {
        const escaped = zoneName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(?:^|[\\s,.-])${escaped}(?:[\\s,.-]|$)`);
        if (regex.test(cleaned)) {
          return resolveZoneAlias(zoneName);
        }
      }
    }
  }

  // Strategy 2: Match zone prefix patterns (hay X, quartier X, etc.)
  const prefixZone = extractZoneFromPrefix(cleaned);
  if (prefixZone) {
    // Validate against known zones if city is known
    const resolved = resolveZoneAlias(prefixZone);
    if (city) {
      const cityZones = KNOWN_ZONES[city];
      if (cityZones && cityZones.includes(resolved)) {
        return resolved;
      }
    }
    // Even without city validation, return the prefix-detected zone
    return resolved;
  }

  // Strategy 3: Scan all known zones across all cities (no city context)
  if (!city) {
    for (const [, zones] of ZONES_BY_CITY_SORTED) {
      for (const zoneName of zones) {
        // Skip very short zone names to avoid false positives
        if (zoneName.length < 5) continue;
        // Skip ambiguous zones (exist in multiple cities)
        const zoneCity = ZONE_TO_CITY.get(zoneName);
        if (zoneCity === "__ambiguous__") continue;

        const escaped = zoneName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(?:^|[\\s,.-])${escaped}(?:[\\s,.-]|$)`);
        if (regex.test(cleaned)) {
          return resolveZoneAlias(zoneName);
        }
      }
    }
  }

  return null;
}

function extractZoneFromPrefix(cleaned: string): string | null {
  for (const prefix of ZONE_PREFIXES) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(?:^|[\\s,])${escaped}\\s+([a-z][a-z\\s-]{1,30}?)(?:[,.]|\\d|$)`
    );
    const match = cleaned.match(regex);
    if (match) {
      const zonePart = match[1].trim().replace(/\s+/g, " ");
      if (zonePart.length >= 3) {
        return zonePart;
      }
    }
  }
  return null;
}

function resolveZoneAlias(zone: string): string {
  const normalized = zone
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  return ZONE_ALIASES[normalized] ?? normalized;
}
