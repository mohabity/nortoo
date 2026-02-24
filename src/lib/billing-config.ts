// ═══════════════════════════════════════════════════════════
// BILLING CONFIG — TVA, coordonnées bancaires, numéros de facture
// Modèle de facturation par virement bancaire (pas Stripe)
// ═══════════════════════════════════════════════════════════

export const TVA_RATE = 20; // %
export const CURRENCY = "MAD";
export const PAYMENT_TERMS_DAYS = 15;

export const BANK_INFO = {
  bankName: "Attijariwafa Bank",
  accountHolder: "NORTOO SARL",
  rib: "xxx xxx xxx xxx xxx xxx xxx xx",
  iban: "MAxx xxxx xxxx xxxx xxxx xxxx xxx",
  swift: "BCMAMAMC",
} as const;

export const COMPANY_INFO = {
  name: "NORTOO SARL",
  ice: "00000000000000", // placeholder
  address: "Casablanca, Maroc",
  email: "billing@nortoo.ma",
  website: "nortoo.ma",
} as const;

/**
 * Generate a sequential invoice number: NRT-2026-0001
 */
export function generateInvoiceNumber(sequence: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `NRT-${y}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Calculate HT, TVA, TTC from a price in centimes.
 * Input: priceHT in centimes (e.g. 29900 = 299.00 DH)
 */
export function calculateAmounts(priceHT: number) {
  const amountHT = priceHT;
  const amountTVA = Math.round(amountHT * TVA_RATE / 100);
  const amountTTC = amountHT + amountTVA;
  return { amountHT, amountTVA, amountTTC };
}

/**
 * Format an amount in centimes to display (e.g. 29900 → "299,00 DH")
 */
export function formatAmountDH(centimes: number): string {
  const dh = centimes / 100;
  return dh.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
}
