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
 * Calculate HT, TVA, TTC from a TTC price in centimes.
 * Les prix des plans nortoo sont TTC (TVA incluse).
 * Input: priceTTC in centimes (e.g. 29900 = 299.00 DH TTC)
 *
 * Formule: HT = TTC / 1.20, TVA = TTC - HT
 * Exemple Starter: TTC 29900 → HT 24917 → TVA 4983
 */
export function calculateAmounts(priceTTC: number) {
  const amountTTC = priceTTC;
  const amountHT = Math.round(amountTTC / (1 + TVA_RATE / 100));
  const amountTVA = amountTTC - amountHT;
  return { amountHT, amountTVA, amountTTC };
}

/**
 * Calculate the prorated TTC amount for a mid-month plan upgrade.
 *
 * Formule :
 *   joursRestants = joursTotal - jourActuel + 1 (aujourd'hui inclus)
 *   montant = (prixNouveauPlan - prixAncienPlan) × (joursRestants / joursTotal)
 *   arrondi au centime le plus proche
 *
 * Exemple : Starter→Pro le 15 février (28 jours) :
 *   diff = 69900 - 29900 = 40000 centimes
 *   restant = 28 - 15 + 1 = 14 jours
 *   prorata = 40000 × (14/28) = 20000 centimes = 200,00 DH TTC
 *
 * @param currentPriceTTC - prix actuel TTC en centimes (0 pour trial)
 * @param newPriceTTC - prix du nouveau plan TTC en centimes
 * @param now - date du changement (défaut: maintenant)
 * @returns montant TTC proraté en centimes, arrondi
 */
export function calculateProratedUpgrade(
  currentPriceTTC: number,
  newPriceTTC: number,
  now?: Date,
): { proratedTTC: number; daysRemaining: number; daysInMonth: number } {
  const date = now ?? new Date();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const dayOfMonth = date.getDate();
  const daysRemaining = daysInMonth - dayOfMonth + 1; // aujourd'hui inclus

  const dailyDiff = (newPriceTTC - currentPriceTTC) / daysInMonth;
  const proratedTTC = Math.round(dailyDiff * daysRemaining);

  return { proratedTTC, daysRemaining, daysInMonth };
}

/**
 * Format an amount in centimes to display (e.g. 29900 → "299,00 DH")
 */
export function formatAmountDH(centimes: number): string {
  const dh = centimes / 100;
  return dh.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " DH";
}
