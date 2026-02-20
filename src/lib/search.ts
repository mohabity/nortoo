/**
 * Full-text search utilities for orders.
 * - buildSearchIndex: builds a normalized searchable string for an order
 * - expandSearch: expands search terms with known aliases
 * - normalizeSearch: normalizes a user query for matching
 */

// ── Search aliases (fuzzy matching) ──

const SEARCH_ALIASES: Record<string, string[]> = {
  // Villes — same aliases as address parser
  casa: ["casablanca"],
  rbat: ["rabat"],
  mrkch: ["marrakech"],
  fes: ["fes", "fès"],
  tng: ["tanger"],
  kntra: ["kenitra", "kénitra"],
  meknes: ["meknes", "meknès"],

  // Statuts en français
  expedier: ["expedier", "ship"],
  bloquer: ["bloquer", "block"],
  verifier: ["verifier", "verify"],
  signaler: ["signaler", "flag"],

  // Produits courants
  serum: ["serum", "sérum"],
  creme: ["creme", "crème"],
};

/**
 * Normalize text for search indexing and matching.
 * Removes accents, lowercases, collapses whitespace.
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a search index string for an order.
 * Called once at order creation and stored in the DB.
 */
export function buildSearchIndex(order: {
  externalRef?: string | null;
  customerName?: string | null;
  shippingCity?: string | null;
  parsedZone?: string | null;
  shippingAddress?: string | null;
  productName?: string | null;
  total?: number | null;
  customerPhoneLast4?: string | null;
}): string {
  return normalizeForSearch(
    [
      order.externalRef,
      order.customerName,
      order.shippingCity,
      order.parsedZone,
      order.shippingAddress,
      order.productName,
      order.customerPhoneLast4,
      order.total != null ? `${Math.round(order.total)} dh` : null,
      order.total != null ? String(Math.round(order.total)) : null,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

/**
 * Expand a search query into groups of terms.
 * Each group = one original word + its aliases.
 * Groups are ANDed, terms within a group are ORed.
 *
 * "casa fatima" → [["casa", "casablanca"], ["fatima"]]
 */
export function expandSearch(query: string): string[][] {
  const words = normalizeForSearch(query)
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const groups: string[][] = [];

  for (const word of words) {
    const group = [word];
    const aliases = SEARCH_ALIASES[word];
    if (aliases) {
      for (const alias of aliases) {
        const normalized = normalizeForSearch(alias);
        if (!group.includes(normalized)) group.push(normalized);
      }
    }
    groups.push(group);
  }

  return groups;
}
