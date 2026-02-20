import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format amount in Moroccan Dirhams */
export function formatDH(amount: number): string {
  return new Intl.NumberFormat("fr-MA").format(Math.round(amount)) + " DH";
}

/** Score → Tailwind color class */
export function scoreColorClass(score: number): string {
  if (score <= 30) return "text-mint";
  if (score <= 65) return "text-amber";
  if (score <= 85) return "text-rose";
  return "text-violet";
}

/** Score → Background color class (15% opacity) */
export function scoreBgClass(score: number): string {
  if (score <= 30) return "bg-mint/15";
  if (score <= 65) return "bg-amber/15";
  if (score <= 85) return "bg-rose/15";
  return "bg-violet/15";
}

/** Decision → Color class */
export function decisionColorClass(decision: string): string {
  switch (decision) {
    case "ship": return "text-mint";
    case "verify": return "text-amber";
    case "flag": return "text-rose";
    case "block": return "text-violet";
    default: return "text-fog";
  }
}

/** Decision → French label */
export function decisionLabel(decision: string): string {
  switch (decision) {
    case "ship": return "Expédier";
    case "verify": return "Vérifier";
    case "flag": return "Signaler";
    case "block": return "Bloquer";
    default: return decision;
  }
}

/** Delivery status → French label */
export function deliveryLabel(status: string): string {
  switch (status) {
    case "pending": return "En attente";
    case "shipped": return "Expédié";
    case "delivered": return "Livré";
    case "returned": return "Retourné";
    case "cancelled": return "Annulé";
    default: return status;
  }
}

/** Risk level → French label */
export function riskLabel(level: string): string {
  switch (level) {
    case "low": return "Faible";
    case "medium": return "Moyen";
    case "high": return "Élevé";
    case "critical": return "Critique";
    default: return level;
  }
}
