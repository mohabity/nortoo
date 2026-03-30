# nortoo — Résumé complet du projet

> **Contexte** : Ce document est un résumé exhaustif du projet nortoo pour continuer la stratégie marketing et de lancement sur Claude Chat.

---

## 1. Qu'est-ce que nortoo ?

**nortoo** (No RTO) est une plateforme SaaS de **scoring anti-fraude pour le e-commerce COD (Cash-on-Delivery) au Maroc**.

**Le problème** : 30 à 50% des commandes COD au Maroc échouent (refus à la livraison, faux numéros, adresses inexistantes). Chaque RTO coûte ~65 DH au marchand + le coût produit.

**La solution** : nortoo score chaque commande de 0 à 100 et décide automatiquement lesquelles expédier et lesquelles bloquer, via 24 règles d'analyse.

**Domaine** : nortoo.ma (app sur app.nortoo.ma)
**Tagline** : "Scoring anti-fraude COD · Maroc"
**Nom** : toujours en minuscules : nortoo

---

## 2. Scoring Engine (v2.0)

### Architecture : 24 règles · 34 checks · 8 catégories · Score 0-100

**Score de base** : 20 points

| Catégorie | Règles | Détail |
|-----------|--------|--------|
| **Historique** | R1-R5 | Client fiable (-20), connu (-10), récidiviste (+30), 1 échec (+15), nouveau (+10) |
| **Vélocité** | R13-R17 | Burst 1h (+25), flood 24h (+20), adresses multiples (+15), montant cumulé élevé (+10), activité 7j (+8) |
| **Montant** | R6-R7 | Commande élevée >800 DH (+20), modérée >400 DH (+10) |
| **Géographie** | R8 | Ville à risque (+15 statique, dynamique via city_stats/zone_stats) |
| **Adresse** | R9-R10 | Adresse courte/vague (+10), mots suspects (+15) |
| **Nom** | R18-R21 | Nom suspect/fake (+15), trop court (+8), caractères répétés (+10), nom/chiffres mixtes (+5) |
| **Produit** | R12, R22 | SKU à RTO élevé (+12), quantité suspecte (+8) |
| **Temporalité** | R11 | Commande nocturne 00h-06h (+5) |

### Décisions (seuils personnalisables par marchand) :

| Score | Décision | Action |
|-------|----------|--------|
| 0-30 | **SHIP** | Expédier automatiquement |
| 31-65 | **VERIFY** | Vérification requise |
| 66-85 | **FLAG** | Signalé, attention élevée |
| 86-100 | **BLOCK** | Bloquer automatiquement |

### Fonctionnalités avancées du scoring :
- **Poids personnalisables** : chaque catégorie a un multiplicateur ajustable (0.5x à 2x)
- **Presets sectoriels** : Prudent, Équilibré, Permissif
- **Auto-ajustement géographique** : utilise les stats de livraison par ville/quartier pour affiner le risque dynamiquement
- **Network Intelligence** (Phase 2) : scoring cross-marchand via profils réseau agrégés (nécessite autorisation CNDP Art. 12.1.f)
- **Listes téléphone** : whitelist (→ ship forcé) et blacklist (→ block forcé) par marchand

---

## 3. Plans et tarification

| | Trial | Starter | Pro | Scale |
|---|-------|---------|-----|-------|
| **Prix** | 0 DH (30 jours) | 299 DH TTC/mois | 699 DH TTC/mois | 1 499 DH TTC/mois |
| **Commandes/mois** | 50 | 500 | 2 000 | Illimité |
| **Utilisateurs** | 1 | 1 | 3 | 10 |
| **Fonctionnalités** | Scoring de base | + Seuils custom | + Analytics avancées, export PDF | + API, support prioritaire |

- **Pas de carte bancaire requise** pour le trial
- Paiement par **virement bancaire** (facturation mensuelle auto)
- Factures au format "NRT-2026-0001" avec TVA 20%

---

## 4. Fonctionnalités principales

### Dashboard temps réel
- **KPIs** : économies réalisées, score moyen, taux de livraison, commandes bloquées
- **Graphiques** : tendances quotidiennes (Recharts)
- **Table des commandes** : filtres par décision, risque, statut de livraison
- **Slide-over détail** : score, facteurs, explication, historique client, override manuel

### Analytics
- Tendances RTO, ROI, métriques de scoring
- Export PDF des rapports mensuels
- Stats par produit, par ville, par quartier

### Paramètres
- Seuils de scoring personnalisables
- Presets (Prudent / Équilibré / Permissif)
- Poids par catégorie de règle
- Configuration d'intégration (YouCan OAuth, API key, webhook)
- Panneau de test webhook intégré

### Pipeline de commandes
- Statuts : pending → auto_shipped / needs_review / escalated / auto_blocked / merchant_override
- Escalade automatique avec deadlines dynamiques basées sur la valeur
- Notifications par sévérité (info, warning, critical)

### Gestion d'équipe (multi-utilisateurs)
- Rôles : admin, manager, operator
- Système d'invitation par email
- 2FA : TOTP (app authenticator) ou email (code 6 chiffres)

### Support intégré
- **Tickets** : système de tickets avec thread de réponses (admin ↔ marchand)
- **FAQ** : 19 questions, 5 catégories, bilingue FR + Darija
- **Guide utilisateur** : 11 sections avec mockups interactifs
- **Support Bubble** : widget flottant avec accès FAQ + WhatsApp + création ticket
- **WhatsApp** : lien direct vers support

---

## 5. Intégrations

### YouCan (principale)
- **OAuth 2.0** : connexion en 2 clics
- **Webhook automatique** : s'abonne à `order.create` lors de la connexion
- **HMAC-SHA256** : validation de chaque webhook entrant
- **Filtre COD** : ne score que les commandes COD, ignore les paiements en ligne

### API universelle (ingest)
- **POST /api/webhook/ingest** : ingestion de commandes depuis n'importe quelle source
- **Auth** : header `x-nortoo-key` (ou legacy `x-codpilot-key`)
- **Prefix clé** : `nt_live_` (nouvelles) / `cp_live_` (legacy, toujours acceptées)
- Permet de scorer des commandes WhatsApp, Instagram, marketplaces

### Webhook queue
- File d'attente DB-backed (pas de Redis nécessaire)
- Retry automatique avec backoff exponentiel (max 5 tentatives)
- Déduplication par hash de payload
- Statuts : pending → processing → completed/failed/dead

---

## 6. Emails transactionnels (Resend)

- **Expéditeur** : noreply@nortoo.ma
- Emails envoyés :
  - Vérification d'email à l'inscription
  - Bienvenue après inscription
  - Code 2FA par email
  - Réinitialisation de mot de passe
  - Invitation d'équipe
  - Rapports hebdomadaires
  - Rappel de fin de trial
  - Factures mensuelles
- Templates React Email

---

## 7. Conformité Loi 09-08 (CNDP)

### Mesures implémentées :
- **Art. 3e** : Rétention 24 mois max, purge automatique mensuelle (cron)
- **Art. 7-9** : Formulaire public de droits (accès, rectification, suppression, opposition)
- **Art. 9** : Liste d'opposition (phoneHash) — scoring désactivé si opposition
- **Art. 23** : Audit log obligatoire de chaque mutation de données
- **Art. 23-24** : Sécurité — SHA-256 pour les phones (jamais en clair), AES-256-GCM pour les tokens
- **Art. 43-44** : Données hébergées en UE (Frankfurt)
- Champ `cndpDeclarationRef` sur chaque marchand
- Délai de réponse : 10 jours ouvrables max

### Pages légales publiques :
- `/terms` — CGU complètes
- `/privacy` — Politique de confidentialité détaillée
- `/data-rights` — Formulaire interactif de droits

---

## 8. Système de blog / SEO

### Blog auto-généré (IA)
- Articles générés via Anthropic SDK (Claude)
- Support bilingue FR/EN avec traduction automatique
- SEO : titre, description, URL canonique, slug
- Catégories, mots-clés ciblés, score de qualité
- Reading time et word count calculés

### Configuration :
- Articles par semaine configurable
- Taille minimum de queue
- Pause possible avec date de reprise

---

## 9. Admin panel

- Comptes admin individuels avec invitations
- 2FA par email pour les admins
- Gestion des marchands, coupons promotionnels, factures
- Vue des tickets support avec réponses

---

## 10. Crons automatiques (Vercel Cron)

| Job | Schedule | Action |
|-----|----------|--------|
| Purge données expirées | Quotidien 3h UTC | Supprime PII > 24 mois |
| Escalade commandes | Quotidien 8h UTC | Escalade les commandes en attente |
| Retry webhooks | Quotidien 4h UTC | Relance les webhooks échoués |
| Reset mensuel | 1er du mois 00h UTC | Remet les compteurs mensuels à 0 |
| Poll YouCan | Quotidien 6h UTC | Récupère les commandes manquées |
| Rappel trial | Quotidien 7h UTC | Email de rappel fin de trial |
| Vérification trial | Quotidien 9h UTC | Downgrade auto si trial expiré |
| Rapport hebdo | Lundi 9h UTC | Email de résumé hebdomadaire |
| Génération factures | 2 du mois 00h UTC | Génère les factures mensuelles |
| Factures impayées | Quotidien 8h UTC | Marque les factures en retard |

---

## 11. Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Framework** | Next.js 15.5 (App Router) |
| **Langage** | TypeScript |
| **Base de données** | PostgreSQL via Neon (serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | NextAuth.js v5 (beta) |
| **UI** | Tailwind CSS + Radix UI + Lucide Icons |
| **Graphiques** | Recharts |
| **Emails** | Resend + React Email |
| **Rate limiting** | Upstash Redis + @upstash/ratelimit |
| **Monitoring** | Sentry |
| **Paiement** | Stripe (préparé) + virement bancaire |
| **IA** | Anthropic SDK (génération blog) + OpenAI (backup) |
| **PDF** | jsPDF |
| **2FA** | otplib (TOTP) + codes email |
| **Hébergement** | Vercel (region FRA1 — Frankfurt) |
| **CI/CD** | GitHub Actions (lint, types, tests, build) |
| **Tests** | Vitest (unit) + Playwright (E2E) |

---

## 12. Design system

| Élément | Valeur |
|---------|--------|
| **Couleur primaire** | Mint #00E5A0 |
| **Couleur fond sombre** | Midnight #0B0F1A |
| **Slate** | #1E293B |
| **Font display** | Outfit |
| **Font body** | Plus Jakarta Sans |
| **Font mono** | JetBrains Mono |
| **Logo** | "N" stylisé dans carré mint arrondi, path: `M6 18V6l12 12V6` |

---

## 13. Emails officiels

| Email | Usage |
|-------|-------|
| noreply@nortoo.ma | Expéditeur transactionnel |
| support@nortoo.ma | Support client, privacy, DPO |
| hello@nortoo.ma | Contact général |
| billing@nortoo.ma | Facturation |
| admin@nortoo.ma | Administration |

---

## 14. Internationalisation

- **Langues** : Français (défaut) + Anglais
- **Darija** : utilisé dans les FAQ
- Switch de langue dans la navbar

---

## 15. Pages publiques

| Page | URL | Description |
|------|-----|-------------|
| Landing | nortoo.ma | Hero + stats + how it works + features + pricing + FAQ + CTA |
| Présentation | /presentation | Walkthrough détaillé avec mockups annotés |
| Connexion | /login | Email/password + YouCan OAuth |
| Inscription | /register | Formulaire + YouCan OAuth |
| CGU | /terms | Conditions générales |
| Confidentialité | /privacy | Politique de confidentialité |
| Droits données | /data-rights | Formulaire interactif |
| Documentation | /docs | Lien dans le footer (page à créer) |
| Blog | /blog | Articles SEO auto-générés FR/EN |

---

## 16. Onboarding (5 étapes)

1. **Bienvenue** : consentement + nom du marchand
2. **Connexion boutique** : OAuth YouCan ou skip
3. **Configuration scoring** : choix de preset
4. **Test webhook** : envoi d'une commande test
5. **Dashboard prêt** : accès au tableau de bord

---

## 17. Messaging marketing

**Hero FR** : "Bloquez la fraude COD, expédiez en confiance"
**Hero EN** : "Stop COD fraud, ship with confidence"
**Sous-titre** : "30 à 50% des commandes COD échouent au Maroc. nortoo score chaque commande..."

**Stats affichées** :
- 24+ règles de scoring
- -50% de RTO en moyenne
- Score 0-100 par commande

**CTA principal** : "Commencer gratuitement" / "30 jours d'essai gratuit. Aucune carte bancaire requise."

**Trust signals** :
- Données hébergées en UE (Frankfurt)
- Conforme Loi 09-08 (CNDP)
- Chiffrement SHA-256 + AES-256-GCM
- Audit logging

---

## 18. Positionnement et différenciateurs

1. **100% Maroc** : villes à risque locales, Darija, DH, virement bancaire
2. **Multi-canal** : YouCan + WhatsApp + Instagram + marketplaces via API
3. **Scoring transparent** : chaque score expliqué facteur par facteur
4. **Conformité native** : Loi 09-08 intégrée dès la conception
5. **Self-service** : onboarding sans intervention humaine
6. **Prix accessible** : à partir de 299 DH/mois
7. **Données souveraines** : UE, phones hashés, jamais en clair

---

## 19. Opportunités / à faire

- Page `/docs` publique (lien existe, page à créer)
- Témoignages clients / études de cas
- Intégration Shopify (schéma préparé)
- Network Intelligence Phase 2
- Vérification WhatsApp des commandes (schéma préparé)
- Stripe payment (préparé, virement bancaire pour le lancement)
- Sitemap.xml et robots.txt
- Open Graph images
