# Plan de restructuration — nortoo

## Priorité 1 : Supprimer les doublons & quick wins

### 1.1 order-slide-over.tsx (650→~180 lignes)
- Supprimer 217 lignes dupliquées (scoring-details, customer-history, override-section existent déjà dans order-slide-over/)
- Importer les composants extraits à la place
- Extraire order-header, order-pipeline, order-info, helpers

### 1.2 StoreTab.tsx (732→~100 lignes)
- Découper en store-tab/ : youcan.tsx, webhook.tsx, test.tsx, diagnostics.tsx, platforms.tsx, helpers.ts, index.tsx
- Supprimer les fichiers partiellement extraits (store-info.tsx, test-webhook-panel.tsx, webhook-diagnostics.tsx) qui sont aussi des doublons

## Priorité 2 : Pages monolithiques dashboard

### 2.1 analytics/page.tsx (1865→~200 lignes)
- Extraire hooks : useAnalyticsFetch (savings, cities, products, zones), useTableSort<T>
- Extraire composants dans _components/ : kpi-cards, rto-trend-chart, score-distribution-chart, decision-breakdown-chart, products-section, cities-section, zones-section, hourly-patterns-chart
- Déplacer mock data/constants dans _components/constants.ts
- Supprimer le doublon SavingsSection inline (utiliser le composant extrait)
- Extraire badges (RiskTierBadge, ProductRiskBadge, ZoneRiskBadge) dans _components/badges.tsx

### 2.2 orders/page.tsx (1227→~150 lignes)
- Extraire hooks : useOrderFilters, usePagination, useBulkActions
- Extraire composants : orders-filters.tsx, search-suggestions.tsx
- Déplacer DECISION_PILLS config

### 2.3 compliance/page.tsx (916→~150 lignes)
- Extraire ActionModal → _components/action-modal.tsx
- Extraire hooks : useComplianceData, useComplianceActions
- Extraire composants : compliance-kpis, audit-log-table, data-rights-list, cndp-banner
- Déplacer config maps dans _components/config.ts

### 2.4 onboarding/page.tsx (861→~100 lignes)
- Extraire chaque step dans _components/ : step-welcome, step-connect-store, step-configure-scoring, step-test-webhook, step-dashboard-ready
- Extraire useOnboardingWizard hook (state, navigation, persistence)
- Extraire progress indicator

### 2.5 billing/page.tsx (811→~150 lignes)
- Analyser et découper (plans, paiement, factures)

### 2.6 guide/page.tsx (1758→~200 lignes)
- Extraire les 7 mockups dans _components/mockups/
- Extraire les composants utilitaires (Tip, Warning, InfoBox, CodeBlock, ScoreRangeBar, RuleTable)
- Extraire TableOfContents, FaqItem
- Déplacer SECTIONS config

## Priorité 3 : Backend / lib

### 3.1 ingest.ts (850→~300 lignes)
- Découper en lib/ingest/ : index.ts (orchestration), opposition.ts, geo-data.ts, velocity.ts, save-order.ts, metrics.ts

### 3.2 scoring.ts (660→~590 lignes)
- Extraire helpers (isGibberishName, etc.) dans scoring-helpers.ts

### 3.3 Organiser lib/ en sous-dossiers
- lib/auth/ : admin-auth, cron-auth, totp, encryption
- lib/billing/ : billing-config, billing-guard, plans, quota, invoice-generator
- lib/scoring/ : scoring, scoring-simulator, scoring-helpers, score-explanation, translate-explanation
- lib/geo/ : morocco-zones, city-stats, zone-stats, address-parser
- lib/webhooks/ : webhook-verify, webhook-processor
- lib/email/ : email, email-verification, notification-helper

## Priorité 4 : Admin panel (nrt-panel)

### 4.1 nrt-panel pages (630-784 lignes)
- Découper merchants/[id]/page.tsx et page.tsx en composants

## Non touché (déjà correct)
- db/schema.ts (943 lignes mais bien structuré, commentaires clairs)
- scoring.ts règles (logique linéaire lisible, pas besoin de sur-découper)
