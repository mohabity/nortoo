# nortoo — Scoring anti-fraude COD (Next.js)

## Qu'est-ce que nortoo ?

nortoo (No RTO) est une **plateforme de scoring anti-fraude** pour le e-commerce COD (Cash-on-Delivery) au Maroc. 30-50% des commandes COD echouent → nortoo score chaque commande 0-100 et decide LESQUELLES expedier et lesquelles bloquer.

نو ر.ت.و — زيرو رتور

## Architecture

```
YouCan (commande COD)
  → POST /api/webhook/youcan
  → HMAC-SHA256
  → Filtre COD
  → Seuils custom marchand
  → Scoring Engine (13 regles)
  → 0-30: SHIP · 31-65: VERIFY · 66-85: FLAG · 86-100: BLOCK
  → Upsert customer
  → Log DB
  → Dashboard temps reel
```

## Stack: Next.js 15 + Drizzle/Neon PostgreSQL + Tailwind + Recharts

## Routes

| Route | Method | Description |
|-------|--------|-------------|
| /dashboard | GET | KPIs + charts + orders table + detail slide-over |
| /dashboard/orders | GET | Full orders list with filters |
| /dashboard/analytics | GET | RTO trends, ROI, scoring metrics, PDF export |
| /dashboard/settings | GET | Thresholds + presets + scoring weights + integration |
| /dashboard/compliance | GET | Data rights requests, audit log viewer |
| /api/auth/youcan | GET | Start OAuth flow |
| /api/auth/youcan/callback | GET | Exchange code → token → upsert merchant |
| /api/webhook/youcan | POST | Receive order → score → save |
| /api/webhook/ingest | POST | Universal order ingestion (API key auth) |
| /api/dashboard/stats | GET | KPIs |
| /api/dashboard/orders | GET | Paginated orders |
| /api/dashboard/chart | GET | Daily chart data |
| /api/orders/[id]/override | POST | Manual ship/block |
| /api/reports/monthly | GET | Monthly PDF report |
| /api/settings | GET/PUT | Merchant thresholds + weights |
| /api/team | GET/POST | Team management |

## Scoring: 13 Rules

Base 25 → Client fiable -20/-10 → Recidiviste +30/+15 → Nouveau +10 → Montant +20/+10 → Zone risque ville +15 → Zone risque quartier +10 → Adresse +10/+15 → Nocturne +5 → SKU risk → Auto-adjustment geo

## Design System

- Couleurs : mint #00E5A0, midnight #0B0F1A, slate #1E293B
- Fonts : Outfit (display), Plus Jakarta Sans (body), JetBrains Mono (mono)
- Icone : N stylise dans carre mint arrondi `<path d="M6 18V6l12 12V6"/>`
- Nom toujours en minuscules : nortoo
- Tagline FR : "Scoring anti-fraude COD · Maroc"
- Tagline arabe : "نو ر.ت.و — زيرو رتور"

## API Key

- Prefix : `nt_live_` (nouvelles cles)
- Legacy : `cp_live_` (anciennes cles, toujours acceptees)
- Header : `x-nortoo-key` (legacy `x-codpilot-key` aussi accepte)
- Domaine : nortoo.ma

## Emails officiels

- noreply@nortoo.ma — expediteur transactionnel (Resend)
- support@nortoo.ma — support client, privacy, data rights
- hello@nortoo.ma — contact general
- billing@nortoo.ma — facturation
- admin@nortoo.ma — administration

## Plans : Trial (0 DH) · Starter (299 DH) · Growth (599 DH) · Scale (1 499 DH)

## Compliance

- Conforme Loi 09-08 (protection des donnees personnelles)
- Donnees hebergees en UE (Frankfurt)
- Phones haches SHA-256, jamais stockes en clair
- Audit log obligatoire (Art. 23)
- Retention 24 mois (Art. 3e)
- Isolation par merchant_id sur chaque requete
