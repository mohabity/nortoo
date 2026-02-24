import jsPDF from "jspdf";
import { BANK_INFO, COMPANY_INFO, formatAmountDH } from "./billing-config";

// ── Data types ──

export interface InvoiceData {
  invoiceNumber: string;
  period: string; // "2026-03"
  createdAt: Date;
  dueDate: Date;
  merchant: {
    name: string;
    billingName: string | null;
    billingAddress: string | null;
    billingICE: string | null;
    email: string;
  };
  plan: { name: string; label: string };
  amountHT: number;  // centimes
  tvaRate: number;
  amountTVA: number; // centimes
  amountTTC: number; // centimes
  currency: string;
  status: string;
  paidAt: Date | null;
}

// ── Colors ──

const C = {
  mint: [0, 229, 160] as [number, number, number],
  mintDeep: [5, 150, 105] as [number, number, number],
  midnight: [11, 15, 26] as [number, number, number],
  fog: [100, 116, 139] as [number, number, number],
  snow: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  silk: [226, 232, 240] as [number, number, number],
};

// ── Helpers ──

function setColor(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function setFill(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function periodLabel(period: string): string {
  const [year, month] = period.split("-");
  const months = [
    "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${months[parseInt(month, 10)]} ${year}`;
}

// ── Main export ──

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  // ═══ Header: nortoo logo + FACTURE ═══
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setColor(doc, C.mintDeep);
  doc.text("nortoo", margin, y + 7);

  doc.setFontSize(20);
  setColor(doc, C.midnight);
  doc.text("FACTURE", pageW - margin, y + 7, { align: "right" });
  y += 16;

  // Invoice number + date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, C.fog);
  doc.text(`N° ${data.invoiceNumber}`, pageW - margin, y, { align: "right" });
  y += 5;
  doc.text(`Date : ${formatDateFr(data.createdAt)}`, pageW - margin, y, { align: "right" });
  y += 5;
  doc.text(`Échéance : ${formatDateFr(data.dueDate)}`, pageW - margin, y, { align: "right" });
  y += 5;

  if (data.status === "paid" && data.paidAt) {
    doc.setFont("helvetica", "bold");
    setColor(doc, C.mintDeep);
    doc.text(`PAYÉE le ${formatDateFr(data.paidAt)}`, pageW - margin, y, { align: "right" });
  }

  y += 8;

  // ═══ Separator ═══
  setFill(doc, C.silk);
  doc.rect(margin, y, pageW - 2 * margin, 0.4, "F");
  y += 10;

  // ═══ Emitter | Client blocks ═══
  const colW = (pageW - 2 * margin - 10) / 2;

  // Emitter (left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(doc, C.fog);
  doc.text("ÉMETTEUR", margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(doc, C.midnight);
  doc.text(COMPANY_INFO.name, margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, C.fog);
  doc.text(COMPANY_INFO.address, margin, y);
  y += 4;
  doc.text(`ICE : ${COMPANY_INFO.ice}`, margin, y);
  y += 4;
  doc.text(COMPANY_INFO.email, margin, y);

  // Client (right) — same y offset as emitter start
  const clientY = y - 18; // go back to same starting y
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(doc, C.fog);
  doc.text("CLIENT", margin + colW + 10, clientY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(doc, C.midnight);
  doc.text(
    data.merchant.billingName || data.merchant.name,
    margin + colW + 10,
    clientY + 5
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, C.fog);
  let cy = clientY + 10;
  if (data.merchant.billingAddress) {
    doc.text(data.merchant.billingAddress, margin + colW + 10, cy);
    cy += 4;
  }
  if (data.merchant.billingICE) {
    doc.text(`ICE : ${data.merchant.billingICE}`, margin + colW + 10, cy);
    cy += 4;
  }
  doc.text(data.merchant.email, margin + colW + 10, cy);

  y += 14;

  // ═══ Invoice table ═══
  // Header row
  setFill(doc, C.midnight);
  doc.rect(margin, y, pageW - 2 * margin, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(doc, C.white);
  doc.text("Désignation", margin + 4, y + 6);
  doc.text("Période", margin + 95, y + 6);
  doc.text("Montant HT", pageW - margin - 4, y + 6, { align: "right" });
  y += 9;

  // Data row
  setFill(doc, C.snow);
  doc.rect(margin, y, pageW - 2 * margin, 10, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, C.midnight);
  doc.text(`Abonnement nortoo — Plan ${data.plan.name}`, margin + 4, y + 7);
  doc.text(periodLabel(data.period), margin + 95, y + 7);
  doc.text(formatAmountDH(data.amountHT), pageW - margin - 4, y + 7, { align: "right" });
  y += 10;

  // Separator
  setFill(doc, C.silk);
  doc.rect(margin, y, pageW - 2 * margin, 0.3, "F");
  y += 6;

  // Totals
  const totalsX = pageW - margin - 60;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, C.fog);
  doc.text("Sous-total HT", totalsX, y);
  setColor(doc, C.midnight);
  doc.text(formatAmountDH(data.amountHT), pageW - margin - 4, y, { align: "right" });
  y += 6;

  setColor(doc, C.fog);
  doc.text(`TVA ${data.tvaRate}%`, totalsX, y);
  setColor(doc, C.midnight);
  doc.text(formatAmountDH(data.amountTVA), pageW - margin - 4, y, { align: "right" });
  y += 8;

  // Total TTC box
  setFill(doc, C.mintDeep);
  doc.roundedRect(totalsX - 4, y - 4, pageW - margin - totalsX + 8, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, C.white);
  doc.text("Total TTC", totalsX, y + 5);
  doc.text(formatAmountDH(data.amountTTC), pageW - margin - 4, y + 5, { align: "right" });
  y += 22;

  // ═══ Bank details ═══
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(doc, C.midnight);
  doc.text("Coordonnées bancaires", margin, y);
  y += 7;

  setFill(doc, C.snow);
  doc.roundedRect(margin, y, pageW - 2 * margin, 32, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, C.fog);
  const bx = margin + 6;
  let by = y + 6;

  doc.text(`Banque : ${BANK_INFO.bankName}`, bx, by); by += 5;
  doc.text(`Titulaire : ${BANK_INFO.accountHolder}`, bx, by); by += 5;
  doc.text(`RIB : ${BANK_INFO.rib}`, bx, by); by += 5;
  doc.text(`IBAN : ${BANK_INFO.iban}`, bx, by); by += 5;
  doc.text(`SWIFT : ${BANK_INFO.swift}`, bx, by);

  y += 38;

  // ═══ Payment terms ═══
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, C.fog);
  doc.text(
    "Paiement par virement bancaire sous 15 jours à compter de la date de facture.",
    margin,
    y
  );
  y += 4;
  doc.text(
    "Merci d'indiquer le numéro de facture en référence du virement.",
    margin,
    y
  );

  // ═══ Footer ═══
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  setColor(doc, C.fog);
  doc.text(
    `${COMPANY_INFO.name} — ICE : ${COMPANY_INFO.ice} — ${COMPANY_INFO.website}`,
    pageW / 2,
    pageH - 10,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
