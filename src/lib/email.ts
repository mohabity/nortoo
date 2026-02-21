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

const FROM = "Siift <noreply@siift.ma>";

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
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">Siift</span>
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
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">Siift \u00b7 Scorez vos commandes COD \u00b7 \u0633\u064a\u0641\u0637\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Réinitialisation de mot de passe — Siift

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
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">Siift</span>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.1rem;color:#0B0F1A;margin:0 0 16px">V\u00e9rifiez votre email</h2>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 24px">
        Bienvenue sur Siift ! Cliquez sur le bouton ci-dessous pour v\u00e9rifier votre adresse email.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;background:#00E5A0;color:#0B0F1A;font-weight:600;padding:12px 32px;border-radius:10px;text-decoration:none;font-size:0.9rem">
        V\u00e9rifier mon email
      </a>
      <p style="font-size:0.75rem;color:#94A3B8;margin:24px 0 0;line-height:1.5">
        Ce lien expire dans 24 heures.
      </p>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0">
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">Siift \u00b7 Scorez vos commandes COD \u00b7 \u0633\u064a\u0641\u0637\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `V\u00e9rifiez votre email \u2014 Siift

Bienvenue sur Siift ! Cliquez sur ce lien pour v\u00e9rifier votre adresse email :

${verifyUrl}

Ce lien expire dans 24 heures.`;

  return { html, text };
}

/**
 * Build the team invite email (HTML + text).
 */
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
      <span style="font-weight:900;font-size:1.3rem;letter-spacing:-0.04em;color:#0B0F1A">Siift</span>
    </div>
    <div style="padding:32px">
      <h2 style="font-size:1.1rem;color:#0B0F1A;margin:0 0 16px">Vous \u00eates invit\u00e9(e) !</h2>
      <p style="font-size:0.9rem;color:#64748B;line-height:1.6;margin:0 0 8px">
        Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre <strong>${merchantName}</strong> sur Siift en tant que <strong>${roleLabel}</strong>.
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
      <p style="font-size:0.65rem;color:#CBD5E1;margin:0">Siift \u00b7 Scorez vos commandes COD \u00b7 \u0633\u064a\u0641\u0637\u0648</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Invitation \u00e0 rejoindre ${merchantName} \u2014 Siift

Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre ${merchantName} sur Siift en tant que ${roleLabel}.

Cliquez sur ce lien pour cr\u00e9er votre mot de passe et activer votre compte :

${inviteUrl}

Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.`;

  return { html, text };
}
