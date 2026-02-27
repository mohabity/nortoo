import type { Locale } from "@/i18n/types";

/**
 * Email translation dictionary — FR/EN for all merchant-facing templates.
 *
 * Uses plain Unicode characters (not HTML entities).
 * Interpolation: {placeholder} replaced at runtime by t().
 */
const emailDict = {
  // ── Global ──
  "global.footer.tagline": {
    fr: "nortoo · Scoring anti-fraude COD · نو ر.ت.و",
    en: "nortoo · COD Anti-Fraud Scoring · نو ر.ت.و",
  },
  "global.footer.weekly_auto": {
    fr: "Ce rapport est envoyé automatiquement chaque lundi.",
    en: "This report is sent automatically every Monday.",
  },
  "global.footer.manage_notifications": {
    fr: "Gérer les notifications",
    en: "Manage notifications",
  },
  "global.support_hint": {
    fr: "Besoin d'aide ? Répondez à cet email ou contactez",
    en: "Need help? Reply to this email or contact",
  },

  // ── Email Verification ──
  "emailVerification.preview": {
    fr: "Vérifiez votre adresse email nortoo",
    en: "Verify your nortoo email address",
  },
  "emailVerification.subject": {
    fr: "Vérifiez votre email — nortoo",
    en: "Verify your email — nortoo",
  },
  "emailVerification.heading": {
    fr: "Vérifiez votre email",
    en: "Verify your email",
  },
  "emailVerification.body": {
    fr: "Bienvenue sur nortoo ! Cliquez sur le bouton ci-dessous pour vérifier votre adresse email.",
    en: "Welcome to nortoo! Click the button below to verify your email address.",
  },
  "emailVerification.cta": {
    fr: "Vérifier mon email",
    en: "Verify my email",
  },
  "emailVerification.expiry": {
    fr: "Ce lien expire dans 24 heures.",
    en: "This link expires in 24 hours.",
  },

  // ── Password Reset ──
  "passwordReset.preview": {
    fr: "Réinitialisez votre mot de passe nortoo",
    en: "Reset your nortoo password",
  },
  "passwordReset.subject": {
    fr: "Réinitialisation de mot de passe — nortoo",
    en: "Password reset — nortoo",
  },
  "passwordReset.heading": {
    fr: "Réinitialisation de mot de passe",
    en: "Password reset",
  },
  "passwordReset.body": {
    fr: "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
    en: "You requested a password reset. Click the button below to choose a new password.",
  },
  "passwordReset.cta": {
    fr: "Réinitialiser mon mot de passe",
    en: "Reset my password",
  },
  "passwordReset.expiry": {
    fr: "Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.",
    en: "This link expires in 1 hour. If you didn't request this, ignore this email.",
  },

  // ── Welcome ──
  "welcome.preview": {
    fr: "Bienvenue sur nortoo — votre essai de 30 jours commence",
    en: "Welcome to nortoo — your 30-day trial starts now",
  },
  "welcome.subject": {
    fr: "Bienvenue sur nortoo — votre essai de 30 jours commence !",
    en: "Welcome to nortoo — your 30-day trial starts now!",
  },
  "welcome.heading": {
    fr: "Bienvenue sur nortoo, {name} !",
    en: "Welcome to nortoo, {name}!",
  },
  "welcome.body": {
    fr: "Votre compte est créé et votre essai gratuit de 30 jours commence dès maintenant. nortoo analyse chaque commande COD et vous aide à bloquer les retours avant qu'ils ne coûtent cher.",
    en: "Your account is created and your free 30-day trial starts now. nortoo analyses every COD order and helps you block returns before they cost you.",
  },
  "welcome.steps_heading": {
    fr: "3 étapes pour démarrer :",
    en: "3 steps to get started:",
  },
  "welcome.step1_label": {
    fr: "Connectez votre boutique",
    en: "Connect your store",
  },
  "welcome.step1_detail": {
    fr: "YouCan en un clic, ou via notre API universelle.",
    en: "YouCan in one click, or via our universal API.",
  },
  "welcome.step2_label": {
    fr: "Configurez vos seuils de scoring",
    en: "Configure your scoring thresholds",
  },
  "welcome.step2_detail": {
    fr: "choisissez un preset (Permissif, Équilibré ou Strict) ou ajustez finement.",
    en: "choose a preset (Permissive, Balanced or Strict) or fine-tune manually.",
  },
  "welcome.step3_label": {
    fr: "Regardez vos commandes se scorer",
    en: "Watch your orders get scored",
  },
  "welcome.step3_detail": {
    fr: "chaque commande reçoit un score 0-100 en temps réel.",
    en: "every order gets a 0–100 score in real time.",
  },
  "welcome.cta": {
    fr: "Accéder à mon dashboard",
    en: "Go to my dashboard",
  },

  // ── Team Invite ──
  "teamInvite.preview": {
    fr: "Vous êtes invité(e) à rejoindre {merchantName} sur nortoo",
    en: "You've been invited to join {merchantName} on nortoo",
  },
  "teamInvite.subject": {
    fr: "Invitation à rejoindre {merchantName} sur nortoo",
    en: "Invitation to join {merchantName} on nortoo",
  },
  "teamInvite.heading": {
    fr: "Vous êtes invité(e) !",
    en: "You're invited!",
  },
  "teamInvite.body1": {
    fr: "Vous avez été invité(e) à rejoindre {merchantName} sur nortoo en tant que {roleLabel}.",
    en: "You've been invited to join {merchantName} on nortoo as {roleLabel}.",
  },
  "teamInvite.body2": {
    fr: "Cliquez sur le bouton ci-dessous pour créer votre mot de passe et activer votre compte.",
    en: "Click the button below to create your password and activate your account.",
  },
  "teamInvite.cta": {
    fr: "Accepter l'invitation",
    en: "Accept invitation",
  },
  "teamInvite.expiry": {
    fr: "Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.",
    en: "This link expires in 7 days. If you weren't expecting this invitation, ignore this email.",
  },

  // ── Invoice ──
  "invoice.preview": {
    fr: "Facture {invoiceNumber} disponible",
    en: "Invoice {invoiceNumber} available",
  },
  "invoice.subject": {
    fr: "Facture {invoiceNumber} — nortoo",
    en: "Invoice {invoiceNumber} — nortoo",
  },
  "invoice.heading": {
    fr: "Nouvelle facture disponible",
    en: "New invoice available",
  },
  "invoice.greeting": {
    fr: "Bonjour {merchantName},",
    en: "Hello {merchantName},",
  },
  "invoice.body": {
    fr: "Votre facture {invoiceNumber} pour la période {period} est disponible.",
    en: "Your invoice {invoiceNumber} for the period {period} is available.",
  },
  "invoice.amount_label": {
    fr: "Montant TTC",
    en: "Amount incl. tax",
  },
  "invoice.due_label": {
    fr: "Échéance",
    en: "Due date",
  },
  "invoice.bank_heading": {
    fr: "Coordonnées bancaires",
    en: "Bank details",
  },
  "invoice.transfer_ref": {
    fr: "Référence virement :",
    en: "Transfer reference:",
  },
  "invoice.cta": {
    fr: "Voir ma facture",
    en: "View my invoice",
  },

  // ── Overdue ──
  "overdue.preview": {
    fr: "Rappel : Facture {invoiceNumber} impayée",
    en: "Reminder: Invoice {invoiceNumber} unpaid",
  },
  "overdue.subject": {
    fr: "Rappel : Facture {invoiceNumber} impayée — nortoo",
    en: "Reminder: Invoice {invoiceNumber} unpaid — nortoo",
  },
  "overdue.heading": {
    fr: "Facture impayée",
    en: "Unpaid invoice",
  },
  "overdue.greeting": {
    fr: "Bonjour {merchantName},",
    en: "Hello {merchantName},",
  },
  "overdue.body": {
    fr: "Votre facture {invoiceNumber} d'un montant de {amountTTC} est arrivée à échéance le {dueDate} et reste impayée.",
    en: "Your invoice {invoiceNumber} for {amountTTC} was due on {dueDate} and remains unpaid.",
  },
  "overdue.warning_heading": {
    fr: "Risque de suspension",
    en: "Suspension risk",
  },
  "overdue.warning_body": {
    fr: "Sans règlement dans les plus brefs délais, votre compte pourra être suspendu et le scoring de vos commandes interrompu.",
    en: "Without payment as soon as possible, your account may be suspended and order scoring interrupted.",
  },
  "overdue.bank_heading": {
    fr: "Coordonnées bancaires",
    en: "Bank details",
  },
  "overdue.transfer_ref": {
    fr: "Référence virement :",
    en: "Transfer reference:",
  },
  "overdue.cta": {
    fr: "Régler ma facture",
    en: "Pay my invoice",
  },

  // ── Weekly Report ──
  "weeklyReport.preview": {
    fr: "Rapport semaine {weekRange} — {totalOrders} commandes",
    en: "Weekly report {weekRange} — {totalOrders} orders",
  },
  "weeklyReport.sub_header": {
    fr: "Rapport hebdomadaire",
    en: "Weekly report",
  },
  "weeklyReport.title": {
    fr: "Résumé de la semaine",
    en: "Weekly summary",
  },
  "weeklyReport.greeting": {
    fr: "Bonjour {merchantName}",
    en: "Hello {merchantName}",
  },
  "weeklyReport.kpi_scored": {
    fr: "Commandes scorées",
    en: "Scored orders",
  },
  "weeklyReport.kpi_blocked": {
    fr: "Commandes bloquées",
    en: "Blocked orders",
  },
  "weeklyReport.kpi_block_pct": {
    fr: "{blockRate}% du total",
    en: "{blockRate}% of total",
  },
  "weeklyReport.kpi_avg_score": {
    fr: "Score moyen",
    en: "Average score",
  },
  "weeklyReport.kpi_savings": {
    fr: "Économies",
    en: "Savings",
  },
  "weeklyReport.kpi_savings_sub": {
    fr: "{blockedOrders} fraudes évitées",
    en: "{blockedOrders} frauds avoided",
  },
  "weeklyReport.decisions_heading": {
    fr: "Répartition des décisions",
    en: "Decision breakdown",
  },
  "weeklyReport.delivery_heading": {
    fr: "Feedback livraison",
    en: "Delivery feedback",
  },
  "weeklyReport.delivered": {
    fr: "Livrées",
    en: "Delivered",
  },
  "weeklyReport.returned": {
    fr: "Retournées",
    en: "Returned",
  },
  "weeklyReport.rto_rate": {
    fr: "Taux RTO réel :",
    en: "Actual RTO rate:",
  },
  "weeklyReport.cities_heading": {
    fr: "Villes les plus risquées",
    en: "Highest-risk cities",
  },
  "weeklyReport.cities_col_city": {
    fr: "Ville",
    en: "City",
  },
  "weeklyReport.cities_col_orders": {
    fr: "Commandes",
    en: "Orders",
  },
  "weeklyReport.cities_col_block_rate": {
    fr: "Taux blocage",
    en: "Block rate",
  },
  "weeklyReport.insights_heading": {
    fr: "Insights",
    en: "Insights",
  },
  "weeklyReport.no_insights": {
    fr: "Aucun insight notable cette semaine.",
    en: "No notable insights this week.",
  },
  "weeklyReport.cta": {
    fr: "Voir le dashboard →",
    en: "View dashboard →",
  },
  "weeklyReport.insight_volume_up": {
    fr: "📈 Volume en hausse : +{diff} commandes vs semaine précédente.",
    en: "📈 Volume up: +{diff} orders vs last week.",
  },
  "weeklyReport.insight_less_blocked": {
    fr: "✅ Moins de blocages cette semaine ({blockedOrders} vs {prevWeekBlocked}).",
    en: "✅ Fewer blocks this week ({blockedOrders} vs {prevWeekBlocked}).",
  },
  "weeklyReport.insight_savings": {
    fr: "💰 Économies estimées : {savings} DH grâce au scoring nortoo.",
    en: "💰 Estimated savings: {savings} MAD thanks to nortoo scoring.",
  },
  "weeklyReport.insight_rto_high": {
    fr: "⚠️ Taux RTO élevé ({rtoRate}%). Vérifiez les retours de cette semaine.",
    en: "⚠️ High RTO rate ({rtoRate}%). Review this week's returns.",
  },
  "weeklyReport.insight_risky_city": {
    fr: "🏙️ {city} reste la ville la plus risquée ({blockRate}% blocage).",
    en: "🏙️ {city} remains the highest-risk city ({blockRate}% block rate).",
  },
  // ── Plan Change ──
  "planChange.greeting": {
    fr: "Bonjour {name},",
    en: "Hello {name},",
  },
  "planChange.previousPlan": {
    fr: "Plan actuel",
    en: "Current plan",
  },
  "planChange.newPlan": {
    fr: "Nouveau plan",
    en: "New plan",
  },
  "planChange.effectiveDate": {
    fr: "Date d'effet",
    en: "Effective date",
  },
  "planChange.amount": {
    fr: "Montant prorata TTC",
    en: "Prorated amount incl. tax",
  },
  "planChange.upgrade.preview": {
    fr: "Passage au plan {newPlan}",
    en: "Upgrade to {newPlan} plan",
  },
  "planChange.upgrade.subject": {
    fr: "Votre plan a été mis à niveau — nortoo",
    en: "Your plan has been upgraded — nortoo",
  },
  "planChange.upgrade.heading": {
    fr: "Passage au plan {newPlan}",
    en: "Upgrade to {newPlan}",
  },
  "planChange.upgrade.body": {
    fr: "Votre plan nortoo est passé de {previousPlan} à {newPlan}. Une facture prorata de {amount} a été générée.",
    en: "Your nortoo plan has been changed from {previousPlan} to {newPlan}. A prorated invoice of {amount} has been generated.",
  },
  "planChange.upgrade.cta": {
    fr: "Voir ma facturation",
    en: "View my billing",
  },
  "planChange.downgrade.preview": {
    fr: "Rétrogradation vers {newPlan} planifiée",
    en: "Downgrade to {newPlan} scheduled",
  },
  "planChange.downgrade.subject": {
    fr: "Rétrogradation de plan planifiée — nortoo",
    en: "Plan downgrade scheduled — nortoo",
  },
  "planChange.downgrade.heading": {
    fr: "Passage au plan {newPlan} planifié",
    en: "Downgrade to {newPlan} scheduled",
  },
  "planChange.downgrade.body": {
    fr: "Votre plan passera de {previousPlan} à {newPlan} à la fin de votre cycle de facturation actuel ({effectiveDate}).",
    en: "Your plan will change from {previousPlan} to {newPlan} at the end of your current billing cycle ({effectiveDate}).",
  },
  "planChange.downgrade.cta": {
    fr: "Gérer mon abonnement",
    en: "Manage my subscription",
  },
  // ── Admin MFA ──
  "adminMfa.preview": {
    fr: "Code de connexion admin nortoo",
    en: "nortoo admin login code",
  },
  "adminMfa.subject": {
    fr: "Code de connexion admin — nortoo",
    en: "Admin login code — nortoo",
  },
  "adminMfa.heading": {
    fr: "Code de connexion admin",
    en: "Admin login code",
  },
  "adminMfa.greeting": {
    fr: "Bonjour {name},",
    en: "Hello {name},",
  },
  "adminMfa.body": {
    fr: "Voici votre code de connexion au panel d'administration nortoo :",
    en: "Here is your login code for the nortoo admin panel:",
  },
  "adminMfa.expiry": {
    fr: "Ce code expire dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez cet email.",
    en: "This code expires in 10 minutes. If you didn't request this code, ignore this email.",
  },
  // ── Admin Approval Request ──
  "adminApproval.preview": {
    fr: "Nouveau compte admin en attente d'approbation",
    en: "New admin account pending approval",
  },
  "adminApproval.subject": {
    fr: "Nouveau compte admin en attente d'approbation — nortoo",
    en: "New admin account pending approval — nortoo",
  },
  "adminApproval.heading": {
    fr: "Nouveau compte admin créé",
    en: "New admin account created",
  },
  "adminApproval.body": {
    fr: "Un nouveau compte administrateur a été créé sur le panel nortoo et nécessite votre approbation.",
    en: "A new admin account has been created on the nortoo panel and requires your approval.",
  },
  "adminApproval.name_label": {
    fr: "Nom",
    en: "Name",
  },
  "adminApproval.email_label": {
    fr: "Email",
    en: "Email",
  },
  "adminApproval.date_label": {
    fr: "Date de création",
    en: "Created on",
  },
  "adminApproval.action": {
    fr: "Veuillez vérifier ce compte et confirmer ou révoquer l'accès depuis le panel d'administration.",
    en: "Please review this account and confirm or revoke access from the admin panel.",
  },
  "adminApproval.cta": {
    fr: "Accéder au panel admin",
    en: "Go to admin panel",
  },
  // ── Admin Invite ──
  "adminInvite.preview": {
    fr: "Vous êtes invité(e) à rejoindre le panel admin nortoo",
    en: "You've been invited to join the nortoo admin panel",
  },
  "adminInvite.subject": {
    fr: "Invitation au panel admin — nortoo",
    en: "Admin panel invitation — nortoo",
  },
  "adminInvite.heading": {
    fr: "Invitation au panel admin",
    en: "Admin panel invitation",
  },
  "adminInvite.body1": {
    fr: "{inviterName} vous a invité(e) à rejoindre le panel d'administration nortoo.",
    en: "{inviterName} has invited you to join the nortoo admin panel.",
  },
  "adminInvite.body2": {
    fr: "Cliquez sur le bouton ci-dessous pour créer votre mot de passe et activer votre compte administrateur.",
    en: "Click the button below to create your password and activate your admin account.",
  },
  "adminInvite.cta": {
    fr: "Accepter l'invitation",
    en: "Accept invitation",
  },
  "adminInvite.expiry": {
    fr: "Ce lien expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.",
    en: "This link expires in 7 days. If you weren't expecting this invitation, ignore this email.",
  },
  // ── Login Code (Merchant email 2FA) ──
  "loginCode.preview": {
    fr: "Code de connexion nortoo",
    en: "nortoo login code",
  },
  "loginCode.subject": {
    fr: "Code de connexion — nortoo",
    en: "Login code — nortoo",
  },
  "loginCode.heading": {
    fr: "Code de connexion",
    en: "Login code",
  },
  "loginCode.greeting": {
    fr: "Bonjour {name},",
    en: "Hello {name},",
  },
  "loginCode.body": {
    fr: "Voici votre code de connexion à votre compte nortoo :",
    en: "Here is your login code for your nortoo account:",
  },
  "loginCode.expiry": {
    fr: "Ce code expire dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez cet email.",
    en: "This code expires in 10 minutes. If you didn't request this code, ignore this email.",
  },
  // ── Trial Reminder ──
  "trialReminder.preview": {
    fr: "Votre essai nortoo expire dans {daysRemaining} jour(s)",
    en: "Your nortoo trial expires in {daysRemaining} day(s)",
  },
  "trialReminder.subject": {
    fr: "⏳ Plus que {daysRemaining} jour(s) d'essai — nortoo",
    en: "⏳ {daysRemaining} day(s) left in your trial — nortoo",
  },
  "trialReminder.badge": {
    fr: "J-{daysRemaining}",
    en: "{daysRemaining} day(s) left",
  },
  "trialReminder.greeting": {
    fr: "Bonjour {name},",
    en: "Hello {name},",
  },
  "trialReminder.body_7": {
    fr: "Il vous reste une semaine d'essai gratuit sur nortoo. C'est le bon moment pour explorer toutes les fonctionnalités et voir l'impact du scoring sur vos retours COD.",
    en: "You have one week left in your free nortoo trial. Now is a great time to explore all features and see the impact of scoring on your COD returns.",
  },
  "trialReminder.body_3": {
    fr: "Plus que {daysRemaining} jours avant la fin de votre essai. Si vous êtes satisfait du scoring anti-fraude, choisissez un plan pour continuer sans interruption.",
    en: "Only {daysRemaining} days left in your trial. If you're satisfied with the anti-fraud scoring, choose a plan to continue without interruption.",
  },
  "trialReminder.body_1": {
    fr: "Votre essai gratuit expire demain. Après expiration, le scoring de vos commandes sera interrompu. Passez à un plan payant maintenant pour éviter toute interruption.",
    en: "Your free trial expires tomorrow. After expiration, order scoring will be paused. Upgrade to a paid plan now to avoid any interruption.",
  },
  "trialReminder.features_heading": {
    fr: "Ce que vous conservez avec un plan payant :",
    en: "What you keep with a paid plan:",
  },
  "trialReminder.feature_1": {
    fr: "Scoring anti-fraude en temps réel sur chaque commande COD",
    en: "Real-time anti-fraud scoring on every COD order",
  },
  "trialReminder.feature_2": {
    fr: "Dashboard avec analytics, tendances et rapports hebdomadaires",
    en: "Dashboard with analytics, trends and weekly reports",
  },
  "trialReminder.feature_3": {
    fr: "Blocage automatique des commandes à haut risque",
    en: "Automatic blocking of high-risk orders",
  },
  "trialReminder.cta": {
    fr: "Choisir un plan →",
    en: "Choose a plan →",
  },
} as const satisfies Record<string, { fr: string; en: string }>;

// ─────────────────────────────────────────────────────────────
// Accessor: t(locale, key, params?)
// ─────────────────────────────────────────────────────────────

type EmailDictKey = keyof typeof emailDict;

export function t(
  locale: Locale,
  key: EmailDictKey,
  params?: Record<string, string | number>,
): string {
  const entry = emailDict[key];
  const raw: string = entry[locale] ?? entry["fr"];
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}
