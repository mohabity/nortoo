import { Resend } from "resend";
import { render } from "@react-email/render";
import * as React from "react";
import type { Locale } from "@/i18n/types";
import { t } from "@/emails/i18n";
import { formatDate, formatNumber } from "@/lib/i18n-utils";

// Email components
import { PasswordReset } from "@/emails/PasswordReset";
import { EmailVerification } from "@/emails/EmailVerification";
import { Welcome } from "@/emails/Welcome";
import { TeamInvite } from "@/emails/TeamInvite";
import { WeeklyReport as WeeklyReportComponent } from "@/emails/WeeklyReport";
import { Invoice } from "@/emails/Invoice";
import { Overdue } from "@/emails/Overdue";
import { DataRightsConfirmation } from "@/emails/DataRightsConfirmation";
import { DataRightsNotification } from "@/emails/DataRightsNotification";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "nortoo <noreply@nortoo.ma>";

/**
 * Send an email via Resend. Falls back to console.log if no API key is set.
 * Returns true if sent (or logged), false on error.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!resend) {
    console.log("═══ EMAIL (no provider configured) ═══");
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Text:\n${payload.text}`);
    console.log("═══ END EMAIL ═══");
    return true;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════════════════════════

export async function buildPasswordResetEmail(resetUrl: string, locale: Locale = "fr") {
  const element = React.createElement(PasswordReset, { resetUrl, locale });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { subject: t(locale, "passwordReset.subject"), html, text };
}

// ═══════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ═══════════════════════════════════════════════════════════

export async function buildEmailVerificationEmail(verifyUrl: string, locale: Locale = "fr") {
  const element = React.createElement(EmailVerification, { verifyUrl, locale });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { subject: t(locale, "emailVerification.subject"), html, text };
}

// ═══════════════════════════════════════════════════════════
// WELCOME
// ═══════════════════════════════════════════════════════════

export async function buildWelcomeEmail(name: string, dashboardUrl: string, locale: Locale = "fr") {
  const element = React.createElement(Welcome, { name, dashboardUrl, locale });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { subject: t(locale, "welcome.subject"), html, text };
}

// ═══════════════════════════════════════════════════════════
// TEAM INVITE
// ═══════════════════════════════════════════════════════════

export async function buildTeamInviteEmail(
  inviteUrl: string,
  merchantName: string,
  roleLabel: string,
  locale: Locale = "fr",
) {
  const element = React.createElement(TeamInvite, {
    inviteUrl,
    merchantName,
    roleLabel,
    locale,
  });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { subject: t(locale, "teamInvite.subject", { merchantName }), html, text };
}

// ═══════════════════════════════════════════════════════════
// WEEKLY REPORT
// ═══════════════════════════════════════════════════════════

export interface WeeklyReport {
  merchantName: string;
  merchantEmail: string;
  weekStart: string;
  weekEnd: string;
  totalOrders: number;
  blockedOrders: number;
  flaggedOrders: number;
  verifiedOrders: number;
  shippedOrders: number;
  avgScore: number;
  totalRevenue: number;
  blockedRevenue: number;
  savings: number;
  deliveredCount: number;
  returnedCount: number;
  topRiskCities: { city: string; orders: number; blockRate: number }[];
  prevWeekOrders?: number;
  prevWeekBlocked?: number;
}

export async function buildWeeklyReportEmail(data: WeeklyReport, locale: Locale = "fr") {
  const element = React.createElement(WeeklyReportComponent, { ...data, locale });
  const html = await render(element);
  const text = await render(element, { plainText: true });

  const dateOpts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  const weekRange = `${formatDate(data.weekStart, locale, dateOpts)} — ${formatDate(data.weekEnd, locale, dateOpts)}`;
  const currencyLabel = locale === "en" ? "MAD" : "DH";

  return {
    subject: `📊 ${t(locale, "weeklyReport.preview", { weekRange, totalOrders: data.totalOrders })} · ${formatNumber(data.savings, locale)} ${currencyLabel}`,
    html,
    text,
  };
}

// ═══════════════════════════════════════════════════════════
// INVOICE
// ═══════════════════════════════════════════════════════════

export interface InvoiceEmailData {
  merchantName: string;
  invoiceNumber: string;
  period: string;
  amountTTC: string;
  dueDate: string;
  rib: string;
  iban: string;
  swift: string;
}

export async function buildInvoiceEmail(data: InvoiceEmailData, locale: Locale = "fr") {
  const element = React.createElement(Invoice, { ...data, locale });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { subject: t(locale, "invoice.subject", { invoiceNumber: data.invoiceNumber }), html, text };
}

// ═══════════════════════════════════════════════════════════
// OVERDUE
// ═══════════════════════════════════════════════════════════

export interface OverdueEmailData {
  merchantName: string;
  invoiceNumber: string;
  amountTTC: string;
  dueDate: string;
  rib: string;
  iban: string;
  swift: string;
}

export async function buildOverdueEmail(data: OverdueEmailData, locale: Locale = "fr") {
  const element = React.createElement(Overdue, { ...data, locale });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { subject: t(locale, "overdue.subject", { invoiceNumber: data.invoiceNumber }), html, text };
}

// ═══════════════════════════════════════════════════════════
// DATA RIGHTS — Confirmation + Notification (FR only)
// ═══════════════════════════════════════════════════════════

export interface DataRightsConfirmationData {
  reference: string;
  typeLabel: string;
  deadline: string;
}

export async function buildDataRightsConfirmationEmail(data: DataRightsConfirmationData) {
  const element = React.createElement(DataRightsConfirmation, data);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return {
    subject: `Demande ${data.reference} enregistrée — nortoo`,
    html,
    text,
  };
}

export interface DataRightsNotificationData {
  reference: string;
  typeLabel: string;
  phoneHashPartial: string;
  requesterEmail: string;
  details: string | null;
  deadline: string;
  merchantCount: number;
}

export async function buildDataRightsNotificationEmail(data: DataRightsNotificationData) {
  const element = React.createElement(DataRightsNotification, data);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return {
    subject: `[Action requise] Demande ${data.reference} — ${data.typeLabel}`,
    html,
    text,
  };
}
