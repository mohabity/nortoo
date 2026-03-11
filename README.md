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

nortoo integrates with [YouCan](https://youcan.shop) via webhook, scores every COD order **0-100** in real-time using **24 rules (38 checks)**, and returns an actionable decision before the merchant ships.

| Score | Decision | Action |
|-------|----------|--------|
| 0-30 | **Expedier** | Ship with confidence |
| 31-65 | **Verifier** | Confirm by phone |
| 66-85 | **Signaler** | High risk, review manually |
| 86-100 | **Bloquer** | Auto-block or escalate |

---

## Features

- **Real-time scoring** -- 24-rule engine (38 checks) scores orders in <200ms
- **YouCan integration** -- OAuth install + webhook auto-subscribe
- **Universal webhook** -- Works with any platform via `/api/webhook/ingest`
- **Dashboard** -- KPIs, charts, order list with filters, analytics
- **Configurable thresholds** -- Adjust ship/verify/flag/block cutoffs per merchant
- **Custom scoring weights** -- Fine-tune individual rule weights (Pro+)
- **Bulk actions** -- Override or update delivery status for multiple orders
- **CSV & PDF export** -- Export orders and monthly reports
- **Scoring simulator** -- Test threshold changes before applying
- **Team management** -- Multi-user with roles (admin/manager/operator)
- **Two-factor authentication** -- Email-based 2FA for merchant and admin accounts
- **Plan system** -- Trial / Starter / Pro / Scale with feature gating
- **Coupon system** -- Promotional codes for trial extension & first month free
- **Invoice generation** -- Automatic monthly invoices (virement bancaire)
- **Notifications** -- Real-time alerts for high-risk orders
- **Admin panel (nrt-panel)** -- Internal merchant management, coupon admin, webhook debugging
- **Escalation pipeline** -- Auto-escalate pending orders with configurable deadlines
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

24 rules, 38 checks, score 0-100, configurable thresholds and weights.

| Category | Rules | Pts range | Signal |
|----------|-------|-----------|--------|
| **Base** | `R0_BASE` | +20 | Starting score |
| **History** | `R1_LOYAL` `R2_KNOWN` | -20 / -10 | Successful delivery history |
| | `R3_RECIDIVIST` `R4_ONE_FAIL` `R5_NEW` | +10 to +30 | Failed deliveries or first-time |
| **Velocity** | `R13_BURST_1H` `R14_BURST_24H` | +12 to +25 | Order frequency spikes |
| | `R15_MULTI_ADDR` `R16_HIGH_VALUE_24H` | +15 to +20 | Multi-address or high-value bursts |
| | `R17_STEADY` | -8 | Consistent buyer (5+ orders, 70%+ success) |
| **Amount** | `R6_EXTREME` `R6b_VERY_HIGH` `R7_HIGH` | +10 to +25 | High order value |
| | `R7b_ROUND` | +5 | Suspiciously round amount |
| | `R7c_LOW` | -3 | Low-value order |
| **Geography** | `R8_GEO_RISK` `R8_STATIC_HIGH/MED` | +8 to +20 | City-level risk (dynamic + static) |
| | `R8b_ZONE_RISK` | +5 to +25 | Quartier-level risk |
| | `R8c_SAFE_CITY` | -5 | Known safe city |
| **Address** | `R9_VERY_SHORT` `R9b_SHORT` | +10 / +15 | Short shipping address |
| | `R10_GIBBERISH` `R10b_NUMBERS` `R10_NO_ADDR` | +10 to +15 | Low-quality or missing address |
| | `R10c_GOOD_ADDR` | -5 | Detailed address with location keywords |
| **Name** | `R18_NO_NAME` `R19_GIBBERISH_NAME` | +8 / +12 | Missing or gibberish name |
| | `R20_SUSPECT_NAME` `R21_SINGLE_WORD` | +5 / +10 | Fake or incomplete name |
| **Product** | `R12_SKU_RISK` | +5 to +15 | High RTO product history |
| | `R12_SKU_SAFE` `R22_HIGH_QTY` | -5 / +8 | Safe product or bulk order |
| **Time** | `R11_DEEP_NIGHT` `R11b_NIGHT` | +5 to +10 | Late-night order (+2 if weekend) |
| | `R11c_PEAK` | -3 | Business hours order |
| **Network** | `R_NETWORK` | -15 to +20 | Cross-merchant intelligence (Phase 2) |

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
git clone https://github.com/mohabity/nortoo.git
cd nortoo
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
POST /api/webhook/youcan     YouCan order.created payload (HMAC-SHA256)
POST /api/webhook/ingest     Universal JSON endpoint
POST /api/webhook/stripe     Stripe billing events
POST /api/webhook/test       Integration testing
POST /api/webhook/ping       Health check
```

Authenticate with `x-nortoo-key` header (legacy `x-codpilot-key` also accepted) or `?key=` query param. API keys use the `nt_live_` prefix (legacy `cp_live_` still accepted).

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
GET    /api/orders                  Paginated order list with filters
GET    /api/orders/:id              Order detail + scoring factors
POST   /api/orders/:id/override     Manual ship/block decision
POST   /api/orders/:id/delivery     Update delivery status
POST   /api/orders/bulk-override    Bulk override decisions
POST   /api/orders/bulk-delivery    Bulk delivery status update
GET    /api/orders/export           CSV/PDF export
GET    /api/orders/search-suggest   Search autocomplete

GET    /api/stats                   Dashboard KPIs
GET    /api/dashboard/chart         Daily chart data
GET    /api/dashboard/savings       RTO savings calculations
GET    /api/dashboard/urgent        Escalated orders needing review
GET    /api/dashboard/audit         Audit log viewer

GET    /api/analytics/cities        City RTO stats
GET    /api/analytics/products      Product stats
GET    /api/analytics/zones         Zone/quartier stats
GET    /api/analytics/export        Export analytics data

GET    /api/settings                Scoring thresholds + weights
PUT    /api/settings                Update merchant settings
POST   /api/settings/plan           Update plan
POST   /api/settings/api-key/regenerate  Regenerate API key
GET    /api/settings/diagnostics    System diagnostics

GET    /api/scoring/simulate        Test scoring rules
GET    /api/reports/monthly         Monthly PDF report

GET    /api/team                    List team members
POST   /api/team                    Invite user
PATCH  /api/team/:id               Update role
DELETE /api/team/:id               Remove member

GET    /api/notifications           List notifications
POST   /api/notifications/:id/read  Mark as read
POST   /api/notifications/read-all  Mark all as read

GET    /api/billing                 Billing info
POST   /api/billing/change          Change plan
GET    /api/billing/invoices        List invoices
GET    /api/billing/invoices/:id/pdf Download invoice PDF

POST   /api/coupons/validate        Validate coupon code
POST   /api/coupons/redeem          Apply coupon
```

### Authentication & 2FA

```
POST /api/auth/register             Merchant registration
POST /api/auth/forgot-password      Password reset
POST /api/auth/2fa/enable-email     Enable email-based 2FA
POST /api/auth/2fa/send-code        Send 2FA code
POST /api/auth/2fa/verify-code      Verify 2FA code
```

### Data Rights (Art. 7-9 Loi 09-08)

```
POST /api/data-rights/submit        Public data rights request
POST /api/data-rights/access        Consumer data access request
POST /api/data-rights/delete        Consumer data deletion
POST /api/data-rights/oppose        Consumer opposition to scoring
GET  /api/data-rights/list          List pending requests
```

### Admin Panel (nrt-panel)

```
GET    /api/nrt-panel/overview         Admin dashboard
GET    /api/nrt-panel/merchants        List all merchants
POST   /api/nrt-panel/merchants/:id/actions  Merchant actions
GET    /api/nrt-panel/coupons          Manage coupons
GET    /api/nrt-panel/invoices         List all invoices
GET    /api/nrt-panel/audit-logs       System audit logs
GET    /api/nrt-panel/webhook-queue    View retry queue
POST   /api/nrt-panel/youcan/fix-webhooks  Repair YouCan webhooks
```

### Cron Jobs (11)

```
/api/cron/purge-expired       Daily 3AM    Auto-delete expired data (Art. 3e)
/api/cron/escalate            Daily 8AM    Process escalation rules
/api/cron/mark-overdue        Daily        Mark escalations overdue
/api/cron/webhook-retry       Daily 4AM    Retry failed webhooks
/api/cron/monthly-reset       1st of month Reset order counters
/api/cron/trial-check         Daily        Check trial expirations
/api/cron/trial-reminder      Daily        Send trial expiry reminders
/api/cron/youcan-poll         Daily        Poll YouCan for delivery status
/api/cron/generate-invoices   Monthly      Generate invoices
/api/cron/weekly-report       Weekly       Generate weekly reports
/api/cron/refresh-network     Daily        Update network profiles (Phase 2)
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
- API keys use `nt_live_` prefix with 32 hex bytes (legacy `cp_live_` still accepted)
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
│   └── api/                 100+ API routes
├── lib/
│   ├── scoring.ts           24-rule scoring engine (38 checks)
│   ├── ingest.ts            Order processing pipeline
│   ├── plans.ts             Plan configs + feature gating
│   ├── require-feature.ts   Server-side feature gates
│   ├── hash.ts              Phone hashing (SHA-256)
│   └── api-key.ts           API key generation
├── db/
│   ├── schema.ts            25 Drizzle table definitions
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
