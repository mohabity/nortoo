<p align="center">
  <img src="public/nortoo-logo-hd.png" alt="nortoo" width="220" />
</p>

<h3 align="center">Scoring anti-fraude COD pour le e-commerce marocain</h3>

<p align="center">
  nortoo score chaque commande Cash-on-Delivery en temps reel et dit au marchand :
  <br /><strong>Expedier, Verifier, Signaler ou Bloquer.</strong>
</p>

<p align="center">
  <a href="#scoring-engine">Scoring</a> &middot;
  <a href="#api-endpoints">API</a> &middot;
  <a href="#getting-started">Setup</a> &middot;
  <a href="#compliance">Loi 09-08</a>
</p>

---

## The Problem

Moroccan e-commerce merchants lose **30-50% of COD orders** to RTO (Return To Origin). A customer places an order, the merchant ships it, and the customer refuses delivery. The merchant loses shipping costs, packaging, and inventory time.

## The Solution

nortoo integrates with [YouCan](https://youcan.shop) via webhook, scores every COD order **0-100** in real-time using 15 behavioral rules, and returns an actionable decision before the merchant ships.

| Score | Decision | Action |
|-------|----------|--------|
| 0-31 | **Expedier** | Ship with confidence |
| 31-66 | **Verifier** | Confirm by phone/WhatsApp |
| 66-86 | **Signaler** | High risk, review manually |
| 86-100 | **Bloquer** | Auto-block or escalate |

---

## Features

- **Real-time scoring** -- 15-rule engine scores orders in <200ms
- **YouCan integration** -- OAuth install + webhook auto-subscribe
- **Universal webhook** -- Works with any platform via `/api/webhook/ingest`
- **Dashboard** -- KPIs, charts, order list with filters, analytics
- **Configurable thresholds** -- Adjust ship/verify/flag/block cutoffs per merchant
- **Bulk actions** -- Override multiple orders at once
- **CSV & PDF export** -- Export orders and monthly reports
- **Scoring simulator** -- Test threshold changes before applying
- **Team management** -- Multi-user with roles (admin/manager/operator)
- **Plan system** -- Trial / Starter / Pro / Scale with feature gating
- **Notifications** -- Real-time alerts for high-risk orders
- **Audit trail** -- Every action logged (Art. 23 Loi 09-08)
- **Data rights** -- Access, deletion, opposition endpoints (Art. 7-9)
- **Auto-purge** -- Expired data deleted by daily cron (Art. 3e)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL on [Neon](https://neon.tech) (Frankfurt) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (JWT sessions + YouCan OAuth) |
| Cache | Upstash Redis |
| UI | Tailwind CSS + shadcn/ui + Radix |
| Charts | Recharts |
| Validation | Zod |
| Email | Resend |
| Payments | Stripe |
| Deploy | Vercel (fra1 region) |

---

## Scoring Engine

15 rules, score 0-100, configurable thresholds.

| Rule | Pts | Signal |
|------|-----|--------|
| `R0_BASE` | +25 | Baseline for every order |
| `R1_LOYAL` | -20 | Customer has 3+ successful deliveries |
| `R2_KNOWN` | -10 | Customer has 1+ successful delivery |
| `R3_RECIDIVIST` | +30 | Customer has 2+ failed deliveries |
| `R4_ONE_FAIL` | +15 | Customer has 1 failed delivery |
| `R5_NEW` | +10 | First-time customer |
| `R6_VERY_HIGH` | +20 | Order > 1,000 DH |
| `R7_HIGH` | +10 | Order > 500 DH |
| `R8_GEO_RISK` | +8 to +20 | City-level geographic risk |
| `R8b_ZONE_RISK` | +5 to +25 | Quartier-level risk |
| `R9_SHORT_ADDR` | +10 | Shipping address < 15 chars |
| `R10_GIBBERISH` | +15 | Address fails quality check |
| `R11_NIGHT` | +5 | Order placed 1-5 AM |
| `R12_SKU_RISK` | +5 to +15 | Product has high RTO history |
| `R_NETWORK` | +/-20 | Cross-merchant network score (Phase 3) |

---

## Plans

| | Trial | Starter | Pro | Scale |
|---|-------|---------|-----|-------|
| **Prix** | Gratuit | 299 DH/mois | 699 DH/mois | 1,499 DH/mois |
| **Commandes/mois** | 50 | 500 | 2,000 | Illimite |
| **Utilisateurs** | 1 | 1 | 3 | 10 |
| Scoring + Dashboard | yes | yes | yes | yes |
| Export CSV | -- | yes | yes | yes |
| Actions groupees | -- | yes (20/lot) | yes (50/lot) | yes (illimite) |
| Simulateur | -- | -- | yes | yes |
| Poids personnalises | -- | -- | yes | yes |
| Rapport PDF | -- | -- | yes | yes |
| Multi-utilisateurs | -- | -- | -- | yes |

> Les commandes sont **toujours scorees** meme si la limite est depassee. Aucune donnee n'est perdue.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or a [Neon](https://neon.tech) account)

### 1. Clone & install

```bash
git clone https://github.com/mohabity/codpilot.git
cd codpilot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the required variables:

```env
# Database (Neon PostgreSQL, EU Frankfurt)
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=           # openssl rand -base64 32
AUTH_URL=http://localhost:3000

# Security
PHONE_HASH_SALT=       # openssl rand -hex 32

# YouCan OAuth (optional for dev)
YOUCAN_CLIENT_ID=
YOUCAN_CLIENT_SECRET=
YOUCAN_REDIRECT_URI=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=           # openssl rand -hex 16
```

### 3. Setup database

```bash
npm run db:push        # Push schema to database
npm run db:seed        # Seed with 50 test orders (optional)
```

### 4. Run

```bash
npm run dev            # http://localhost:3000
```

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema directly (dev) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed test data |

---

## API Endpoints

### Webhooks (API key auth)

```
POST /api/webhook/youcan     YouCan order.created payload
POST /api/webhook/ingest     Universal JSON endpoint
POST /api/webhook/ping       Health check
```

Authenticate with `x-codpilot-key` header or `?key=` query param.

**Universal ingest payload:**

```json
{
  "ref": "#1234",
  "customer": {
    "phone": "0612345678",
    "name": "Ahmed",
    "city": "Casablanca",
    "address": "123 Rue Mohammed V, Maarif"
  },
  "total": 349,
  "currency": "MAD",
  "product": "T-shirt Nike",
  "shipping_city": "Casablanca",
  "shipping_address": "123 Rue Mohammed V, Maarif"
}
```

**Response:**

```json
{
  "orderId": 42,
  "score": 55,
  "decision": "verify",
  "riskLevel": "medium",
  "confidence": 0.7,
  "factors": [
    { "rule": "R0_BASE", "points": 25, "reason": "Score de base" },
    { "rule": "R5_NEW", "points": 10, "reason": "Nouveau client" },
    { "rule": "R6_VERY_HIGH", "points": 20, "reason": "Montant eleve" }
  ]
}
```

### Dashboard API (session auth)

```
GET    /api/orders                  Paginated order list
GET    /api/orders/:id              Order detail + scoring
POST   /api/orders/:id/override     Manual override
POST   /api/orders/bulk-override    Bulk override
GET    /api/orders/export           CSV export

GET    /api/stats                   Dashboard KPIs
GET    /api/chart                   Chart data

GET    /api/analytics/cities        City RTO stats
GET    /api/analytics/products      Product stats
GET    /api/analytics/zones         Zone stats

GET    /api/settings                Merchant settings
PUT    /api/settings                Update settings
GET    /api/settings/plan           Plan + usage info

POST   /api/scoring/simulate        Test scoring rules
GET    /api/reports/monthly         Monthly PDF report

GET    /api/team                    List team members
POST   /api/team                    Invite user
```

### Data Rights (Art. 7-9 Loi 09-08)

```
POST /api/data-rights/access       Consumer data access request
POST /api/data-rights/delete       Consumer data deletion
POST /api/data-rights/oppose       Consumer opposition to scoring
```

### Cron Jobs

```
/api/cron/purge-expired     Daily 3AM   Auto-delete expired data
/api/cron/escalate          Daily 8AM   Process escalation rules
/api/cron/webhook-retry     Daily 4AM   Retry failed webhooks
/api/cron/monthly-reset     1st of month Reset order counters
```

---

## Compliance

### Loi 09-08 (Protection des donnees personnelles)

nortoo is built from the ground up for compliance with Morocco's data protection law.

| Article | Implementation |
|---------|---------------|
| **Art. 3e** (Retention) | `retention_expires_at` on all personal data, daily purge cron |
| **Art. 7** (Access) | `/api/data-rights/access` endpoint |
| **Art. 8** (Deletion) | `/api/data-rights/delete` endpoint |
| **Art. 9** (Opposition) | Opposition list disables scoring for consumer |
| **Art. 12.1.f** (Network) | Network intelligence requires CNDP authorization |
| **Art. 23** (Security) | Phone SHA-256 hashing, audit trail, tenant isolation |
| **Art. 25** (Confidentiality) | `merchant_id` on every query, no cross-tenant access |
| **Art. 43** (Transfer) | All infrastructure in EU (Frankfurt), zero US transfer |

### Security measures

- Phone numbers are **SHA-256 hashed** immediately on ingestion, never stored raw
- Only the last 4 digits are kept for display
- Every data mutation creates an audit log entry
- API keys use `cp_live_` prefix with 32 hex bytes
- JWT sessions with Auth.js v5
- CSRF protection on OAuth flows
- Rate limiting via Upstash Redis

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              Login, register, OAuth
│   ├── dashboard/           Main merchant UI
│   │   ├── page.tsx         Overview (KPIs + charts)
│   │   ├── orders/          Orders list + detail
│   │   ├── analytics/       RTO analytics
│   │   ├── settings/        Configuration (10 tabs)
│   │   └── compliance/      Data rights + audit log
│   └── api/                 53+ API routes
├── lib/
│   ├── scoring.ts           15-rule scoring engine
│   ├── ingest.ts            Order processing pipeline
│   ├── plans.ts             Plan configs + feature gating
│   ├── require-feature.ts   Server-side feature gates
│   ├── hash.ts              Phone hashing (SHA-256)
│   └── api-key.ts           API key generation
├── db/
│   ├── schema.ts            17 Drizzle table definitions
│   └── migrations/          Auto-generated SQL
├── components/
│   ├── ui/                  shadcn/ui components
│   ├── dashboard/           Score badges, KPI cards
│   ├── layout/              Sidebar, header, bottom nav
│   ├── feature-gate.tsx     Client-side plan gating
│   ├── plan-badge.tsx       Plan indicator
│   └── plan-banner.tsx      Trial/limit warnings
├── hooks/
│   └── use-plan.ts          Plan access hook
└── types/                   TypeScript type definitions
```

---

## Deployment

nortoo is deployed on **Vercel (fra1 region)** for EU data residency compliance.

```bash
vercel --prod
```

All infrastructure must remain in the EU:
- **Database:** Neon (eu-central-1, Frankfurt)
- **Redis:** Upstash (eu-central-1, Frankfurt)
- **Compute:** Vercel (fra1, Frankfurt)

---

## License

Private. All rights reserved.
