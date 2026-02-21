/**
 * Monthly report email template structure.
 * Template only — no sending, no cron. Ready for future email digest feature.
 */

export interface MonthlyReportEmail {
  to: string;
  merchantName: string;
  month: string; // "Février 2026"
  kpis: {
    totalOrders: number;
    deliveryRate: string; // "87.3%"
    savings: string; // "12,450 DH"
    roi: string; // "8.3×"
  };
  topInsight: string;
  reportUrl: string; // Download link
}

/**
 * Build the monthly report email HTML + text.
 * Follows nortoo branding (same style as src/lib/email.ts templates).
 */
export function buildMonthlyReportEmail(data: MonthlyReportEmail): {
  html: string;
  text: string;
} {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <!-- Header -->
        <tr><td style="padding:32px 32px 0;text-align:center">
          <div style="font-size:24px;font-weight:800;color:#059669;letter-spacing:-0.04em">nortoo</div>
          <h1 style="margin:12px 0 4px;font-size:20px;font-weight:700;color:#0B0F1A">
            Rapport mensuel
          </h1>
          <p style="margin:0;font-size:14px;color:#64748B">${data.month} &middot; ${data.merchantName}</p>
        </td></tr>

        <!-- KPIs -->
        <tr><td style="padding:24px 32px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:50%;padding:8px;text-align:center;background:#f8fafc;border-radius:8px">
                <div style="font-size:24px;font-weight:800;color:#0B0F1A">${data.kpis.totalOrders.toLocaleString("fr-FR")}</div>
                <div style="font-size:12px;color:#64748B;margin-top:2px">Commandes</div>
              </td>
              <td style="width:8px"></td>
              <td style="width:50%;padding:8px;text-align:center;background:#f8fafc;border-radius:8px">
                <div style="font-size:24px;font-weight:800;color:#0B0F1A">${data.kpis.deliveryRate}</div>
                <div style="font-size:12px;color:#64748B;margin-top:2px">Taux de livraison</div>
              </td>
            </tr>
            <tr><td colspan="3" style="height:8px"></td></tr>
            <tr>
              <td style="width:50%;padding:8px;text-align:center;background:#f8fafc;border-radius:8px">
                <div style="font-size:24px;font-weight:800;color:#059669">${data.kpis.savings}</div>
                <div style="font-size:12px;color:#64748B;margin-top:2px">\u00C9conomies</div>
              </td>
              <td style="width:8px"></td>
              <td style="width:50%;padding:8px;text-align:center;background:#f8fafc;border-radius:8px">
                <div style="font-size:24px;font-weight:800;color:#0B0F1A">${data.kpis.roi}</div>
                <div style="font-size:12px;color:#64748B;margin-top:2px">ROI</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Top insight -->
        ${data.topInsight ? `<tr><td style="padding:0 32px 24px">
          <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400E">
            \uD83D\uDCA1 ${data.topInsight}
          </div>
        </td></tr>` : ""}

        <!-- CTA -->
        <tr><td style="padding:0 32px 32px;text-align:center">
          <a href="${data.reportUrl}" style="display:inline-block;background:#059669;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
            T\u00E9l\u00E9charger le rapport PDF
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">
            nortoo &middot; Scoring anti-fraude COD &middot; nortoo.io
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `nortoo - Rapport mensuel
${data.month} - ${data.merchantName}

Commandes : ${data.kpis.totalOrders.toLocaleString("fr-FR")}
Taux de livraison : ${data.kpis.deliveryRate}
\u00C9conomies : ${data.kpis.savings}
ROI : ${data.kpis.roi}

${data.topInsight ? `\uD83D\uDCA1 ${data.topInsight}\n` : ""}
T\u00E9l\u00E9charger le rapport : ${data.reportUrl}

nortoo - Scoring anti-fraude COD - nortoo.io`;

  return { html, text };
}
