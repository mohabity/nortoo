import { Resend } from "resend";

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

/**
 * Build the password reset email (HTML + text).
 */
export function buildPasswordResetEmail(resetUrl: string) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F8FAFC;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
    <div style="padding:24px 32px;border-bottom:1px solid #E2E8F0">
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">nortoo</span>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.1rem;color:#0B0F1A;margin:0 0 16px">R\u00e9initialisation de mot de passe</h2>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 24px">
        Vous avez demand\u00e9 \u00e0 r\u00e9initialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#00E5A0;color:#0B0F1A;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;font-size:0.9rem">
        R\u00e9initialiser mon mot de passe
      </a>
      <p style="font-size:0.75rem;color:#94A3B8;margin:24px 0 0;line-height:1.5">
        Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
      </p>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">nortoo \u00b7 Scoring anti-fraude COD \u00b7 \u0646\u0648 \u0631.\u062a.\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Réinitialisation de mot de passe — nortoo

Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur ce lien pour choisir un nouveau mot de passe :

${resetUrl}

Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.`;

  return { html, text };
}

/**
 * Build the email verification email (HTML + text).
 */
export function buildEmailVerificationEmail(verifyUrl: string) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F8FAFC;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
    <div style="padding:24px 32px;border-bottom:1px solid #E2E8F0">
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">nortoo</span>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.1rem;color:#0B0F1A;margin:0 0 16px">V\u00e9rifiez votre email</h2>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 24px">
        Bienvenue sur nortoo ! Cliquez sur le bouton ci-dessous pour v\u00e9rifier votre adresse email.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;background:#00E5A0;color:#0B0F1A;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;font-size:0.9rem">
        V\u00e9rifier mon email
      </a>
      <p style="font-size:0.75rem;color:#94A3B8;margin:24px 0 0;line-height:1.5">
        Ce lien expire dans 24 heures.
      </p>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">nortoo \u00b7 Scoring anti-fraude COD \u00b7 \u0646\u0648 \u0631.\u062a.\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `V\u00e9rifiez votre email \u2014 nortoo

Bienvenue sur nortoo ! Cliquez sur ce lien pour v\u00e9rifier votre adresse email :

${verifyUrl}

Ce lien expire dans 24 heures.`;

  return { html, text };
}

/**
 * Build the team invite email (HTML + text).
 */
// ═══════════════════════════════════════════════════════════
// WEEKLY REPORT — Rapport hebdomadaire automatique
// ═══════════════════════════════════════════════════════════

export interface WeeklyReport {
  merchantName: string;
  merchantEmail: string;
  weekStart: string; // ISO date "2026-02-16"
  weekEnd: string;   // ISO date "2026-02-22"
  // KPIs
  totalOrders: number;
  blockedOrders: number;
  flaggedOrders: number;
  verifiedOrders: number;
  shippedOrders: number;
  avgScore: number;
  // Revenue
  totalRevenue: number;
  blockedRevenue: number;
  savings: number;      // = blockedRevenue * rtoCostPercent + blockedOrders * rtoCostFixed
  // Delivery feedback
  deliveredCount: number;
  returnedCount: number;
  // Top risk cities
  topRiskCities: { city: string; orders: number; blockRate: number }[];
  // Week-over-week comparison (optional)
  prevWeekOrders?: number;
  prevWeekBlocked?: number;
}

function formatDateFr(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function pct(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function trend(current: number, previous: number | undefined): string {
  if (previous === undefined || previous === 0) return "";
  const diff = current - previous;
  const arrow = diff >= 0 ? "↑" : "↓";
  const pctChange = Math.abs(Math.round((diff / previous) * 100));
  return ` <span style="font-size:11px;color:${diff >= 0 ? "#FBBF24" : "#34D399"}">${arrow}${pctChange}%</span>`;
}

/**
 * Build and send the weekly report email.
 */
export function buildWeeklyReportEmail(data: WeeklyReport) {
  const weekRange = `${formatDateFr(data.weekStart)} — ${formatDateFr(data.weekEnd)}`;
  const blockRate = data.totalOrders > 0 ? Math.round((data.blockedOrders / data.totalOrders) * 100) : 0;
  const deliveryTotal = data.deliveredCount + data.returnedCount;
  const rtoRate = deliveryTotal > 0 ? Math.round((data.returnedCount / deliveryTotal) * 100) : 0;

  // Top risk cities rows
  const cityRows = data.topRiskCities
    .slice(0, 5)
    .map(
      (c) => `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #1E293B;color:#CBD5E1;font-size:13px">${c.city}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #1E293B;color:#CBD5E1;font-size:13px;text-align:center">${c.orders}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #1E293B;color:${c.blockRate > 30 ? "#F87171" : "#FBBF24"};font-size:13px;text-align:center;font-weight:600">${Math.round(c.blockRate)}%</td>
      </tr>`
    )
    .join("");

  // Insights
  const insights: string[] = [];
  if (data.prevWeekOrders !== undefined && data.totalOrders > data.prevWeekOrders) {
    insights.push(`📈 Volume en hausse : +${data.totalOrders - data.prevWeekOrders} commandes vs semaine précédente.`);
  }
  if (data.prevWeekBlocked !== undefined && data.blockedOrders < data.prevWeekBlocked) {
    insights.push(`✅ Moins de blocages cette semaine (${data.blockedOrders} vs ${data.prevWeekBlocked}).`);
  }
  if (data.savings > 0) {
    insights.push(`💰 Économies estimées : ${data.savings.toLocaleString("fr-FR")} DH grâce au scoring nortoo.`);
  }
  if (rtoRate > 20) {
    insights.push(`⚠️ Taux RTO élevé (${rtoRate}%). Vérifiez les retours de cette semaine.`);
  }
  if (data.topRiskCities.length > 0 && data.topRiskCities[0].blockRate > 40) {
    insights.push(`🏙️ ${data.topRiskCities[0].city} reste la ville la plus risquée (${Math.round(data.topRiskCities[0].blockRate)}% blocage).`);
  }

  const insightsHtml = insights.length > 0
    ? insights.map((i) => `<li style="margin-bottom:6px;color:#CBD5E1;font-size:13px;line-height:1.5">${i}</li>`).join("")
    : `<li style="color:#94A3B8;font-size:13px">Aucun insight notable cette semaine.</li>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#0B0F1A">
  <div style="max-width:600px;margin:0 auto;background:#0F172A;border-radius:16px;overflow:hidden;border:1px solid #1E293B">

    <!-- Header -->
    <div style="padding:24px 32px;border-bottom:1px solid #1E293B;display:flex;align-items:center;justify-content:space-between">
      <span style="font-weight:900;font-size:1.4rem;letter-spacing:-0.04em;color:#FFFFFF">nortoo</span>
      <span style="font-size:12px;color:#64748B;float:right;line-height:2.2">Rapport hebdomadaire</span>
    </div>

    <!-- Title + Date Range -->
    <div style="padding:24px 32px 16px">
      <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#FFFFFF">Résumé de la semaine</h1>
      <p style="margin:0;font-size:13px;color:#64748B">${weekRange}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#94A3B8">Bonjour ${data.merchantName} 👋</p>
    </div>

    <!-- KPI Grid (2x2) -->
    <div style="padding:0 32px 24px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px">
        <tr>
          <td style="background:#1E293B;border-radius:12px;padding:16px;width:50%;vertical-align:top">
            <p style="margin:0;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">Commandes scorées</p>
            <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:-1px">${data.totalOrders}${trend(data.totalOrders, data.prevWeekOrders)}</p>
          </td>
          <td style="background:#1E293B;border-radius:12px;padding:16px;width:50%;vertical-align:top">
            <p style="margin:0;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">Commandes bloquées</p>
            <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#F87171;letter-spacing:-1px">${data.blockedOrders}${trend(data.blockedOrders, data.prevWeekBlocked)}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#94A3B8">${blockRate}% du total</p>
          </td>
        </tr>
        <tr>
          <td style="background:#1E293B;border-radius:12px;padding:16px;width:50%;vertical-align:top">
            <p style="margin:0;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.5px">Score moyen</p>
            <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:${data.avgScore <= 30 ? "#34D399" : data.avgScore <= 65 ? "#FBBF24" : "#F87171"};letter-spacing:-1px">${data.avgScore}</p>
          </td>
          <td style="background:linear-gradient(135deg,#064E3B,#1E293B);border-radius:12px;padding:16px;width:50%;vertical-align:top">
            <p style="margin:0;font-size:11px;color:#6EE7B7;text-transform:uppercase;letter-spacing:0.5px">💰 Économies</p>
            <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#34D399;letter-spacing:-1px">${data.savings.toLocaleString("fr-FR")} DH</p>
            <p style="margin:4px 0 0;font-size:11px;color:#6EE7B7">${data.blockedOrders} fraudes évitées</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Decision Breakdown -->
    <div style="padding:0 32px 24px">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">Répartition des décisions</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#34D399;font-size:13px;font-weight:600">🟢 Ship</td>
          <td style="padding:8px 0;text-align:center;color:#CBD5E1;font-size:13px">${data.shippedOrders}</td>
          <td style="padding:8px 0;text-align:right;color:#64748B;font-size:13px">${pct(data.shippedOrders, data.totalOrders)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#60A5FA;font-size:13px;font-weight:600">🔵 Verify</td>
          <td style="padding:8px 0;text-align:center;color:#CBD5E1;font-size:13px">${data.verifiedOrders}</td>
          <td style="padding:8px 0;text-align:right;color:#64748B;font-size:13px">${pct(data.verifiedOrders, data.totalOrders)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#FBBF24;font-size:13px;font-weight:600">🟡 Flag</td>
          <td style="padding:8px 0;text-align:center;color:#CBD5E1;font-size:13px">${data.flaggedOrders}</td>
          <td style="padding:8px 0;text-align:right;color:#64748B;font-size:13px">${pct(data.flaggedOrders, data.totalOrders)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#F87171;font-size:13px;font-weight:600">🔴 Block</td>
          <td style="padding:8px 0;text-align:center;color:#CBD5E1;font-size:13px">${data.blockedOrders}</td>
          <td style="padding:8px 0;text-align:right;color:#64748B;font-size:13px">${pct(data.blockedOrders, data.totalOrders)}</td>
        </tr>
      </table>
    </div>

    <!-- Delivery Feedback -->
    ${deliveryTotal > 0 ? `
    <div style="padding:0 32px 24px">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">Feedback livraison</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;color:#34D399;font-size:13px;font-weight:600">✅ Livrées</td>
          <td style="padding:8px 0;text-align:center;color:#CBD5E1;font-size:13px">${data.deliveredCount}</td>
          <td style="padding:8px 0;text-align:right;color:#64748B;font-size:13px">${pct(data.deliveredCount, deliveryTotal)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#F87171;font-size:13px;font-weight:600">↩️ Retournées</td>
          <td style="padding:8px 0;text-align:center;color:#CBD5E1;font-size:13px">${data.returnedCount}</td>
          <td style="padding:8px 0;text-align:right;color:#64748B;font-size:13px">${pct(data.returnedCount, deliveryTotal)}</td>
        </tr>
      </table>
      <p style="margin:8px 0 0;font-size:11px;color:#64748B">Taux RTO réel : <span style="color:${rtoRate > 20 ? "#F87171" : "#34D399"};font-weight:600">${rtoRate}%</span></p>
    </div>
    ` : ""}

    <!-- Top Risk Cities -->
    ${data.topRiskCities.length > 0 ? `
    <div style="padding:0 32px 24px">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">Villes les plus risquées</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <th style="padding:6px 12px;text-align:left;color:#64748B;font-size:11px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #334155">Ville</th>
          <th style="padding:6px 12px;text-align:center;color:#64748B;font-size:11px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #334155">Commandes</th>
          <th style="padding:6px 12px;text-align:center;color:#64748B;font-size:11px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #334155">Taux blocage</th>
        </tr>
        ${cityRows}
      </table>
    </div>
    ` : ""}

    <!-- Insights -->
    <div style="padding:0 32px 24px">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">💡 Insights</h3>
      <ul style="margin:0;padding:0 0 0 20px">${insightsHtml}</ul>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center">
      <a href="https://nortoo.ma/dashboard" style="display:inline-block;background:#00E5A0;color:#0B0F1A;font-weight:700;padding:14px 40px;border-radius:12px;text-decoration:none;font-size:14px">
        Voir le dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#0B0F1A;border-top:1px solid #1E293B">
      <p style="font-size:11px;color:#475569;margin:0;text-align:center">
        nortoo · Scoring anti-fraude COD · نو ر.ت.و — زيرو رتور
      </p>
      <p style="font-size:10px;color:#334155;margin:6px 0 0;text-align:center">
        Ce rapport est envoyé automatiquement chaque lundi. <a href="https://nortoo.ma/dashboard/settings" style="color:#64748B;text-decoration:underline">Gérer les notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Rapport hebdomadaire nortoo — ${weekRange}

Bonjour ${data.merchantName},

RÉSUMÉ DE LA SEMAINE
• Commandes scorées : ${data.totalOrders}
• Commandes bloquées : ${data.blockedOrders} (${blockRate}%)
• Score moyen : ${data.avgScore}
• Économies estimées : ${data.savings.toLocaleString("fr-FR")} DH

DÉCISIONS
• Ship : ${data.shippedOrders} (${pct(data.shippedOrders, data.totalOrders)})
• Verify : ${data.verifiedOrders} (${pct(data.verifiedOrders, data.totalOrders)})
• Flag : ${data.flaggedOrders} (${pct(data.flaggedOrders, data.totalOrders)})
• Block : ${data.blockedOrders} (${pct(data.blockedOrders, data.totalOrders)})

${deliveryTotal > 0 ? `LIVRAISON
• Livrées : ${data.deliveredCount} (${pct(data.deliveredCount, deliveryTotal)})
• Retournées : ${data.returnedCount} (${pct(data.returnedCount, deliveryTotal)})
• Taux RTO réel : ${rtoRate}%
` : ""}
Voir le dashboard : https://nortoo.ma/dashboard

—
nortoo · Scoring anti-fraude COD`;

  return {
    subject: `📊 Rapport semaine ${weekRange} — ${data.totalOrders} commandes · ${data.savings.toLocaleString("fr-FR")} DH économisés`,
    html,
    text,
  };
}

// ═══════════════════════════════════════════════════════════
// INVOICE — Nouvelle facture disponible
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

export function buildInvoiceEmail(data: InvoiceEmailData) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F8FAFC;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
    <div style="padding:24px 32px;border-bottom:1px solid #E2E8F0">
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">nortoo</span>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.1rem;color:#0B0F1A;margin:0 0 16px">Nouvelle facture disponible</h2>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 8px">
        Bonjour ${data.merchantName},
      </p>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 24px">
        Votre facture <strong style="color:#0B0F1A">${data.invoiceNumber}</strong> pour la p\u00e9riode <strong style="color:#0B0F1A">${data.period}</strong> est disponible.
      </p>
      <div style="background:#F8FAFC;border-radius:10px;padding:16px;margin:0 0 24px">
        <table style="width:100%;font-size:0.85rem;color:#64748B">
          <tr><td style="padding:4px 0">Montant TTC</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#0B0F1A">${data.amountTTC}</td></tr>
          <tr><td style="padding:4px 0">\u00c9ch\u00e9ance</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#0B0F1A">${data.dueDate}</td></tr>
        </table>
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px;margin:0 0 24px">
        <p style="font-size:0.8rem;font-weight:600;color:#059669;margin:0 0 8px">Coordonn\u00e9es bancaires</p>
        <p style="font-size:0.8rem;color:#64748B;line-height:1.6;margin:0">
          RIB : ${data.rib}<br>IBAN : ${data.iban}<br>SWIFT : ${data.swift}
        </p>
        <p style="font-size:0.75rem;color:#94A3B8;margin:8px 0 0">R\u00e9f\u00e9rence virement : <strong>${data.invoiceNumber}</strong></p>
      </div>
      <a href="https://nortoo.ma/dashboard/billing" style="display:inline-block;background:#00E5A0;color:#0B0F1A;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;font-size:0.9rem">
        Voir ma facture
      </a>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">nortoo \u00b7 Scoring anti-fraude COD \u00b7 \u0646\u0648 \u0631.\u062a.\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Facture ${data.invoiceNumber} — nortoo\n\nBonjour ${data.merchantName},\n\nVotre facture ${data.invoiceNumber} pour la période ${data.period} est disponible.\n\nMontant TTC : ${data.amountTTC}\nÉchéance : ${data.dueDate}\n\nCoordonnées bancaires :\nRIB : ${data.rib}\nIBAN : ${data.iban}\nSWIFT : ${data.swift}\n\nRéférence virement : ${data.invoiceNumber}\n\nVoir ma facture : https://nortoo.ma/dashboard/billing`;

  return { subject: `Facture ${data.invoiceNumber} — nortoo`, html, text };
}

// ═══════════════════════════════════════════════════════════
// OVERDUE — Rappel facture impayée
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

export function buildOverdueEmail(data: OverdueEmailData) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F8FAFC;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
    <div style="padding:24px 32px;border-bottom:1px solid #E2E8F0">
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">nortoo</span>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.1rem;color:#F43F5E;margin:0 0 16px">Facture impay\u00e9e</h2>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 8px">Bonjour ${data.merchantName},</p>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 24px">
        Votre facture <strong style="color:#0B0F1A">${data.invoiceNumber}</strong> d'un montant de <strong style="color:#F43F5E">${data.amountTTC}</strong> est arriv\u00e9e \u00e0 \u00e9ch\u00e9ance le <strong>${data.dueDate}</strong> et reste impay\u00e9e.
      </p>
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin:0 0 24px">
        <p style="font-size:0.85rem;color:#DC2626;font-weight:600;margin:0 0 6px">Risque de suspension</p>
        <p style="font-size:0.8rem;color:#64748B;line-height:1.5;margin:0">Sans r\u00e8glement dans les plus brefs d\u00e9lais, votre compte pourra \u00eatre suspendu et le scoring de vos commandes interrompu.</p>
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px;margin:0 0 24px">
        <p style="font-size:0.8rem;font-weight:600;color:#059669;margin:0 0 8px">Coordonn\u00e9es bancaires</p>
        <p style="font-size:0.8rem;color:#64748B;line-height:1.6;margin:0">
          RIB : ${data.rib}<br>IBAN : ${data.iban}<br>SWIFT : ${data.swift}
        </p>
        <p style="font-size:0.75rem;color:#94A3B8;margin:8px 0 0">R\u00e9f\u00e9rence virement : <strong>${data.invoiceNumber}</strong></p>
      </div>
      <a href="https://nortoo.ma/dashboard/billing" style="display:inline-block;background:#F43F5E;color:#FFFFFF;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;font-size:0.9rem">
        R\u00e9gler ma facture
      </a>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">nortoo \u00b7 Scoring anti-fraude COD \u00b7 \u0646\u0648 \u0631.\u062a.\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Rappel : Facture ${data.invoiceNumber} impayée — nortoo\n\nBonjour ${data.merchantName},\n\nVotre facture ${data.invoiceNumber} d'un montant de ${data.amountTTC} est arrivée à échéance le ${data.dueDate} et reste impayée.\n\nSans règlement rapide, votre compte pourra être suspendu.\n\nCoordonnées bancaires :\nRIB : ${data.rib}\nIBAN : ${data.iban}\nSWIFT : ${data.swift}\n\nRéférence virement : ${data.invoiceNumber}\n\nRégler : https://nortoo.ma/dashboard/billing`;

  return { subject: `Rappel : Facture ${data.invoiceNumber} impayée — nortoo`, html, text };
}

export function buildTeamInviteEmail(
  inviteUrl: string,
  merchantName: string,
  roleLabel: string
) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#F8FAFC;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
    <div style="padding:24px 32px;border-bottom:1px solid #E2E8F0">
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">nortoo</span>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.1rem;color:#0B0F1A;margin:0 0 16px">Vous \u00eates invit\u00e9(e) !</h2>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 8px">
        Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre <strong>${merchantName}</strong> sur nortoo en tant que <strong>${roleLabel}</strong>.
      </p>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 24px">
        Cliquez sur le bouton ci-dessous pour cr\u00e9er votre mot de passe et activer votre compte.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;background:#00E5A0;color:#0B0F1A;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;font-size:0.9rem">
        Accepter l'invitation
      </a>
      <p style="font-size:0.75rem;color:#94A3B8;margin:24px 0 0;line-height:1.5">
        Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.
      </p>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">nortoo \u00b7 Scoring anti-fraude COD \u00b7 \u0646\u0648 \u0631.\u062a.\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Invitation \u00e0 rejoindre ${merchantName} \u2014 nortoo

Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre ${merchantName} sur nortoo en tant que ${roleLabel}.

Cliquez sur ce lien pour cr\u00e9er votre mot de passe et activer votre compte :

${inviteUrl}

Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.`;

  return { html, text };
}
