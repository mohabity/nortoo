"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  Rocket,
  LayoutDashboard,
  ShoppingCart,
  Brain,
  BarChart3,
  Settings,
  Code2,
  MessageCircle,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Info,
  ArrowUp,
  Menu,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ─── Section definitions ────────────────────────────────── */

const SECTIONS = [
  { id: "bienvenue", label: "Bienvenue", icon: BookOpen },
  { id: "premiers-pas", label: "Premiers pas", icon: Rocket },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "commandes", label: "Commandes", icon: ShoppingCart },
  { id: "scoring", label: "Scoring", icon: Brain },
  { id: "analytique", label: "Analytique", icon: BarChart3 },
  { id: "parametres", label: "Paramètres", icon: Settings },
  { id: "api", label: "Intégration API", icon: Code2 },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "facturation", label: "Facturation", icon: CreditCard },
  { id: "conformite", label: "Conformité", icon: Shield },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

/* ─── Reusable sub-components ────────────────────────────── */

function GuideSection({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint/10 text-mint">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl font-bold text-midnight">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-slate leading-relaxed">{children}</div>
    </section>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-mint/20 bg-mint/5 p-4 text-sm">
      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-mint" />
      <div>{children}</div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-400/20 bg-amber-50 p-4 text-sm">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
      <div>{children}</div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-sky-400/20 bg-sky-50 p-4 text-sm">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-sky-500" />
      <div>{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-[#0B0F1A] text-gray-100 p-4 text-xs font-mono overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

function ScoreRangeBar() {
  return (
    <div className="space-y-2">
      <div className="flex rounded-lg overflow-hidden text-xs font-semibold text-white h-10">
        <div className="flex items-center justify-center bg-emerald-500" style={{ width: "30%" }}>
          EXPÉDIER
        </div>
        <div className="flex items-center justify-center bg-amber-500" style={{ width: "35%" }}>
          VÉRIFIER
        </div>
        <div className="flex items-center justify-center bg-rose-500" style={{ width: "20%" }}>
          SIGNALER
        </div>
        <div className="flex items-center justify-center bg-violet-600" style={{ width: "15%" }}>
          BLOQUER
        </div>
      </div>
      <div className="flex text-xs text-fog font-mono">
        <span style={{ width: "30%" }}>0 — 30</span>
        <span style={{ width: "35%" }}>31 — 65</span>
        <span style={{ width: "20%" }}>66 — 85</span>
        <span style={{ width: "15%" }}>86 — 100</span>
      </div>
    </div>
  );
}

function RuleTable({
  rules,
}: {
  rules: { id: string; points: string; description: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-silk text-left text-xs text-fog font-medium">
            <th className="py-2 pr-3">Règle</th>
            <th className="py-2 pr-3">Points</th>
            <th className="py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-b border-silk/60">
              <td className="py-2 pr-3 font-mono text-xs text-mint">{r.id}</td>
              <td
                className={cn(
                  "py-2 pr-3 font-mono text-xs font-semibold",
                  r.points.startsWith("-") ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {r.points}
              </td>
              <td className="py-2">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Table of Contents (sidebar / mobile) ───────────────── */

function TableOfContents({
  activeId,
  onSelect,
  className,
}: {
  activeId: string;
  onSelect?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-0.5", className)}>
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => {
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              onSelect?.();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left",
              active
                ? "bg-mint/10 text-mint font-medium"
                : "text-fog hover:bg-gray-50 hover:text-slate"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function GuidePage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Back to top button
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="space-y-6" ref={mainRef}>
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">
          Guide utilisateur
        </h1>
        <p className="text-sm text-fog mt-1">
          Tout ce que vous devez savoir pour utiliser nortoo efficacement.
        </p>
      </div>

      {/* Mobile TOC toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-silk bg-white px-4 py-3 text-sm font-medium text-slate"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-mint" />
            Sommaire
          </span>
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        {mobileNavOpen && (
          <Card className="mt-2">
            <CardContent className="p-3">
              <TableOfContents
                activeId={activeId}
                onSelect={() => setMobileNavOpen(false)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Desktop sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-fog uppercase tracking-wider mb-3 px-3">
              Sommaire
            </p>
            <TableOfContents activeId={activeId} />
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-12">
          {/* ── 1. Bienvenue ────────────────────────────────── */}
          <GuideSection id="bienvenue" title="Bienvenue sur nortoo" icon={BookOpen}>
            <p>
              <strong>nortoo</strong> (No RTO) est une plateforme de scoring anti-fraude
              pour le e-commerce COD (Cash-on-Delivery) au Maroc.
            </p>
            <p>
              Au Maroc, <strong>30 à 50 % des commandes COD échouent</strong> (refus de
              réception, fausses coordonnées, récidivistes). Chaque commande retournée
              coûte en moyenne 40 à 80 DH en frais de livraison perdus.
            </p>
            <p>
              nortoo analyse chaque commande entrante et lui attribue un{" "}
              <strong>score de risque de 0 à 100</strong>. Selon ce score, la commande est
              automatiquement classée :
            </p>
            <ScoreRangeBar />
            <Tip>
              Vous pouvez personnaliser les seuils de décision dans{" "}
              <Link href="/dashboard/settings?tab=scoring" className="text-mint underline">
                Paramètres &gt; Scoring
              </Link>
              .
            </Tip>
          </GuideSection>

          {/* ── 2. Premiers pas ─────────────────────────────── */}
          <GuideSection id="premiers-pas" title="Premiers pas" icon={Rocket}>
            <p>Pour commencer avec nortoo, suivez ces étapes :</p>
            <ol className="list-decimal list-inside space-y-3 ml-1">
              <li>
                <strong>Créez votre compte</strong> — Inscrivez-vous sur{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  app.nortoo.ma
                </span>
                . Vous démarrez avec un <strong>essai gratuit de 30 jours</strong>.
              </li>
              <li>
                <strong>Connectez votre boutique YouCan</strong> — Lors de l&apos;onboarding,
                cliquez sur &quot;Connecter ma boutique&quot; pour autoriser nortoo via OAuth.
                Cela permet de recevoir automatiquement vos commandes.
              </li>
              <li>
                <strong>Choisissez un preset de scoring</strong> — Trois profils prédéfinis :
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-fog">
                  <li>
                    <strong>Permissif</strong> — Laisse passer plus de commandes (idéal au
                    démarrage)
                  </li>
                  <li>
                    <strong>Équilibré</strong> — Bon compromis risque/conversion (recommandé)
                  </li>
                  <li>
                    <strong>Conservateur</strong> — Bloque davantage, minimise les pertes
                  </li>
                </ul>
              </li>
              <li>
                <strong>Testez le webhook</strong> — nortoo envoie un ping de test pour
                vérifier que la connexion fonctionne.
              </li>
              <li>
                <strong>C&apos;est prêt !</strong> — Vos commandes arrivent en temps réel
                sur le dashboard.
              </li>
            </ol>
            <InfoBox>
              Un <strong>checklist de démarrage</strong> apparaît sur votre dashboard tant
              que toutes les étapes ne sont pas complétées.
            </InfoBox>
          </GuideSection>

          {/* ── 3. Dashboard ────────────────────────────────── */}
          <GuideSection id="dashboard" title="Dashboard" icon={LayoutDashboard}>
            <p>
              Le dashboard est votre vue d&apos;ensemble. Il affiche en temps réel les
              indicateurs clés de votre boutique.
            </p>
            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              KPIs principaux
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                <strong>Économies réalisées</strong> — Montant total économisé grâce aux
                commandes bloquées
              </li>
              <li>
                <strong>Score moyen</strong> — Score de risque moyen de vos commandes
              </li>
              <li>
                <strong>Taux de livraison</strong> — Pourcentage de commandes livrées avec
                succès
              </li>
              <li>
                <strong>Commandes bloquées</strong> — Nombre de commandes à haut risque
                interceptées
              </li>
            </ul>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Graphique quotidien
            </h3>
            <p>
              Le graphique affiche l&apos;évolution du nombre de commandes et du score
              moyen jour par jour. Survolez les points pour voir les détails.
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Widget urgences
            </h3>
            <p>
              Les commandes en statut <strong>VÉRIFIER</strong> qui n&apos;ont pas encore
              été traitées apparaissent dans le widget d&apos;urgences avec un délai
              d&apos;escalade. Traitez-les rapidement pour éviter les retards de livraison.
            </p>
          </GuideSection>

          {/* ── 4. Commandes ────────────────────────────────── */}
          <GuideSection id="commandes" title="Commandes" icon={ShoppingCart}>
            <p>
              La page{" "}
              <Link href="/dashboard/orders" className="text-mint underline">
                Commandes
              </Link>{" "}
              affiche toutes vos commandes avec leur score et décision.
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Filtres et recherche
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Filtrez par décision (Expédier, Vérifier, Signaler, Bloquer)</li>
              <li>Filtrez par période (aujourd&apos;hui, 7 jours, 30 jours, personnalisé)</li>
              <li>Recherchez par numéro de commande, nom du client ou ville</li>
            </ul>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Détail d&apos;une commande
            </h3>
            <p>
              Cliquez sur une commande pour ouvrir le panneau de détail. Vous y trouverez :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Le score et la décision avec le badge couleur</li>
              <li>La décomposition des facteurs (chaque règle qui a contribué au score)</li>
              <li>Les informations du client et de la commande</li>
              <li>L&apos;historique du client (commandes précédentes)</li>
            </ul>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Override manuel
            </h3>
            <p>
              Vous pouvez forcer la décision d&apos;une commande manuellement :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                <strong>Forcer l&apos;expédition</strong> — Expédier malgré un score élevé
                (ex : client VIP que vous connaissez)
              </li>
              <li>
                <strong>Forcer le blocage</strong> — Bloquer malgré un score bas (ex :
                suspicion non détectée par l&apos;algorithme)
              </li>
            </ul>
            <Warning>
              Les overrides manuels sont enregistrés dans le journal d&apos;audit. Ils
              permettent aussi d&apos;améliorer le scoring au fil du temps.
            </Warning>
          </GuideSection>

          {/* ── 5. Scoring ──────────────────────────────────── */}
          <GuideSection id="scoring" title="Le scoring : comment ça marche" icon={Brain}>
            <p>
              Le moteur de scoring analyse chaque commande avec{" "}
              <strong>24 règles réparties en 8 catégories</strong>. Chaque règle ajoute ou
              retire des points au score de base de <strong>20</strong>.
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Plages de décision
            </h3>
            <ScoreRangeBar />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              1. Historique client (R1–R5)
            </h3>
            <RuleTable
              rules={[
                { id: "R1", points: "-20", description: "Client fiable (3+ commandes réussies)" },
                { id: "R2", points: "-10", description: "Client connu (1-2 commandes réussies)" },
                { id: "R3", points: "+30", description: "Récidiviste (2+ échecs précédents)" },
                { id: "R4", points: "+15", description: "Un échec précédent" },
                { id: "R5", points: "+10", description: "Nouveau client (aucun historique)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              2. Vélocité (R13–R17)
            </h3>
            <RuleTable
              rules={[
                { id: "R13", points: "+20/+25", description: "Rafale : 2+ commandes en 1 heure (4+ = 25 pts)" },
                { id: "R14", points: "+12", description: "3+ commandes en 24 heures" },
                { id: "R15", points: "+15/+20", description: "2+ adresses différentes en 24h (3+ = 20 pts)" },
                { id: "R16", points: "+18", description: "Montant cumulé > 2 000 DH en 24h" },
                { id: "R17", points: "-8", description: "Client régulier (5+ commandes/7j, 70%+ succès)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              3. Montant (R6–R7)
            </h3>
            <RuleTable
              rules={[
                { id: "R6", points: "+25", description: "Montant extrême (> 2 000 DH)" },
                { id: "R6b", points: "+20", description: "Montant très élevé (> 1 000 DH)" },
                { id: "R7", points: "+10", description: "Montant élevé (> 500 DH)" },
                { id: "R7b", points: "+5", description: "Montant rond suspect (≥ 500 DH, multiple de 100)" },
                { id: "R7c", points: "-3", description: "Petit montant (< 100 DH)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              4. Géographie (R8)
            </h3>
            <p className="mb-3">
              Le scoring géographique utilise les données réelles de votre boutique
              (taux RTO par ville et quartier). En l&apos;absence de données, des listes
              statiques prennent le relais.
            </p>
            <RuleTable
              rules={[
                { id: "R8", points: "+8 à +20", description: "Ville à risque (modéré à critique, basé sur le taux RTO réel)" },
                { id: "R8b", points: "+5 à +25", description: "Quartier à risque (granularité plus fine que la ville)" },
                { id: "R8c", points: "-5 à -8", description: "Zone fiable (taux RTO bas confirmé)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              5. Qualité de l&apos;adresse (R9–R10)
            </h3>
            <RuleTable
              rules={[
                { id: "R9", points: "+15", description: "Adresse très courte (< 8 caractères)" },
                { id: "R9b", points: "+10", description: "Adresse courte (< 15 caractères)" },
                { id: "R10", points: "+15", description: "Adresse suspecte (charabia)" },
                { id: "R10b", points: "+10", description: "Adresse composée principalement de chiffres" },
                { id: "R10c", points: "-5", description: "Adresse détaillée avec mots-clés (rue, av, quartier...)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              6. Analyse du nom (R18–R21)
            </h3>
            <RuleTable
              rules={[
                { id: "R18", points: "+8", description: "Nom client vide ou absent" },
                { id: "R19", points: "+12", description: "Nom charabia (caractères aléatoires)" },
                { id: "R20", points: "+10", description: "Nom suspect (test, fake, aaa...)" },
                { id: "R21", points: "+5", description: "Nom incomplet (un seul mot, pas de nom de famille)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              7. Risque produit (R12, R22)
            </h3>
            <RuleTable
              rules={[
                { id: "R12", points: "+5 à +15", description: "Produit à haut taux RTO (basé sur vos données réelles)" },
                { id: "R12", points: "-5", description: "Produit fiable (taux RTO < 10%)" },
                { id: "R22", points: "+8", description: "Quantité élevée (> 5 articles dans une commande)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
              8. Temporalité (R11)
            </h3>
            <RuleTable
              rules={[
                { id: "R11", points: "+8/+10", description: "Commande en pleine nuit (2h-4h), +10 le weekend" },
                { id: "R11b", points: "+5/+7", description: "Commande nocturne (1h-5h), +7 le weekend" },
                { id: "R11c", points: "-3", description: "Heures de bureau (10h-18h)" },
              ]}
            />

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Indice de confiance
            </h3>
            <p>
              Chaque score est accompagné d&apos;un indice de confiance (0 à 1). Plus
              nortoo dispose de données sur un client, plus la confiance est élevée :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                <strong>0.40</strong> — Baseline (nouveau client, pas d&apos;historique)
              </li>
              <li>
                <strong>0.70</strong> — Client avec 1+ commande antérieure
              </li>
              <li>
                <strong>0.85</strong> — Client avec 3+ commandes
              </li>
              <li>
                <strong>0.95</strong> — Client avec 5+ commandes + données vélocité
              </li>
            </ul>

            <Tip>
              Ajustez les poids et seuils dans{" "}
              <Link href="/dashboard/settings?tab=scoring" className="text-mint underline">
                Paramètres &gt; Scoring
              </Link>{" "}
              pour adapter le moteur à votre activité.
            </Tip>
          </GuideSection>

          {/* ── 6. Analytique ───────────────────────────────── */}
          <GuideSection id="analytique" title="Analytique" icon={BarChart3}>
            <p>
              La page{" "}
              <Link href="/dashboard/analytics" className="text-mint underline">
                Analytique
              </Link>{" "}
              vous donne une vision approfondie de la performance de votre boutique.
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Métriques disponibles
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                <strong>Tendances RTO</strong> — Évolution du taux de retour sur 7/30/90
                jours
              </li>
              <li>
                <strong>Économies cumulées</strong> — Montant total économisé, projection
                mensuelle et annuelle
              </li>
              <li>
                <strong>ROI</strong> — Retour sur investissement (économies ÷ coût de
                l&apos;abonnement)
              </li>
              <li>
                <strong>Villes les plus risquées</strong> — Top villes par taux RTO avec
                volume de commandes
              </li>
              <li>
                <strong>Produits les plus risqués</strong> — Top produits par taux RTO
              </li>
            </ul>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Export PDF
            </h3>
            <p>
              Les plans <strong>Pro</strong> et supérieurs peuvent exporter un rapport
              mensuel en PDF. Le rapport contient les KPIs, graphiques et top risques.
            </p>
          </GuideSection>

          {/* ── 7. Paramètres ───────────────────────────────── */}
          <GuideSection id="parametres" title="Paramètres" icon={Settings}>
            <p>
              La page{" "}
              <Link href="/dashboard/settings" className="text-mint underline">
                Paramètres
              </Link>{" "}
              contient 11 onglets :
            </p>

            <div className="space-y-4 mt-4">
              {[
                {
                  name: "Profil",
                  desc: "Nom du marchand, email, fuseau horaire, langue.",
                },
                {
                  name: "Boutique",
                  desc: "Statut de connexion YouCan, URL de la boutique, informations de synchronisation.",
                },
                {
                  name: "Équipe",
                  desc: "Invitez des collaborateurs et attribuez-leur un rôle (Admin, Manager, Opérateur). Chaque rôle a des permissions différentes.",
                },
                {
                  name: "Scoring",
                  desc: "Ajustez les seuils de décision (Vérifier / Signaler / Bloquer), choisissez un preset, et activez/désactivez le blocage automatique.",
                },
                {
                  name: "Escalade",
                  desc: "Configurez les délais d'escalade pour les commandes en attente de vérification.",
                },
                {
                  name: "Coûts RTO",
                  desc: "Renseignez le coût moyen d'une commande retournée pour affiner le calcul d'économies.",
                },
                {
                  name: "API",
                  desc: "Gérez vos clés API, consultez l'URL du webhook, et testez l'endpoint.",
                },
                {
                  name: "Notifications",
                  desc: "Activez les alertes email pour les commandes bloquées, signalées, ou en escalade. Rapports quotidiens/hebdomadaires disponibles.",
                },
                {
                  name: "Listes téléphones",
                  desc: "Ajoutez des numéros en liste blanche (toujours expédier) ou liste noire (toujours bloquer).",
                },
                {
                  name: "Confidentialité",
                  desc: "Paramètres de rétention des données, référence CNDP, et gestion du consentement.",
                },
                {
                  name: "Facturation",
                  desc: "Détails du plan actuel, historique des factures, upgrade/downgrade.",
                },
              ].map((tab) => (
                <div key={tab.name} className="flex gap-3">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-mint" />
                  <div>
                    <p className="font-medium text-midnight">{tab.name}</p>
                    <p className="text-fog">{tab.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GuideSection>

          {/* ── 8. Intégration API ──────────────────────────── */}
          <GuideSection id="api" title="Intégration API" icon={Code2}>
            <p>
              nortoo expose une API REST pour recevoir et scorer des commandes depuis
              n&apos;importe quelle plateforme (pas seulement YouCan).
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Authentification
            </h3>
            <p>
              Envoyez votre clé API dans le header{" "}
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                x-nortoo-key
              </span>
              .
            </p>
            <p className="text-fog">
              Les clés commencent par{" "}
              <span className="font-mono text-xs">nt_live_</span>. Le header legacy{" "}
              <span className="font-mono text-xs">x-codpilot-key</span> est toujours
              accepté.
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Endpoint d&apos;ingestion
            </h3>
            <CodeBlock>{`POST https://app.nortoo.ma/api/webhook/ingest

Headers:
  x-nortoo-key: nt_live_votre_cle_ici
  Content-Type: application/json

Body:
{
  "order_id": "ORD-12345",
  "total": 450,
  "city": "Casablanca",
  "address": "123 Rue Mohamed V, Quartier Maarif",
  "customer_name": "Ahmed Bennani",
  "customer_phone": "+212600000000",
  "products": [
    { "name": "T-shirt premium", "quantity": 2, "price": 225 }
  ]
}`}</CodeBlock>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Réponse
            </h3>
            <CodeBlock>{`{
  "score": 22,
  "decision": "ship",
  "riskLevel": "low",
  "confidence": 0.85,
  "factors": [
    { "rule": "R0_BASE", "points": 20, "reason": "Score de base" },
    { "rule": "R2_KNOWN", "points": -10, "reason": "Client connu (2 succès)" },
    { "rule": "R7_HIGH", "points": 10, "reason": "Montant élevé (450 DH)" },
    { "rule": "R11c_PEAK", "points": -3, "reason": "Heures de bureau (14h)" },
    { "rule": "R10c_GOOD_ADDR", "points": -5, "reason": "Adresse détaillée" }
  ]
}`}</CodeBlock>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Exemple cURL
            </h3>
            <CodeBlock>{`curl -X POST https://app.nortoo.ma/api/webhook/ingest \\
  -H "x-nortoo-key: nt_live_votre_cle_ici" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "TEST-001",
    "total": 200,
    "city": "Rabat",
    "address": "Avenue Hassan II, Agdal",
    "customer_name": "Test Client"
  }'`}</CodeBlock>

            <Tip>
              Retrouvez votre clé API dans{" "}
              <Link
                href="/dashboard/settings?tab=api"
                className="text-mint underline"
              >
                Paramètres &gt; API
              </Link>
              .
            </Tip>
          </GuideSection>

          {/* ── 9. WhatsApp ─────────────────────────────────── */}
          <GuideSection id="whatsapp" title="Vérification WhatsApp" icon={MessageCircle}>
            <p>
              nortoo peut envoyer un message WhatsApp au client pour confirmer sa commande
              avant expédition. C&apos;est particulièrement utile pour les commandes en
              statut <strong>VÉRIFIER</strong>.
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Comment l&apos;activer
            </h3>
            <ol className="list-decimal list-inside space-y-2 ml-1">
              <li>
                Allez dans{" "}
                <Link
                  href="/dashboard/settings?tab=notifications"
                  className="text-mint underline"
                >
                  Paramètres &gt; Notifications
                </Link>
              </li>
              <li>
                Dans la section WhatsApp, cliquez sur &quot;Configurer WhatsApp
                Business&quot;
              </li>
              <li>
                Suivez le flux d&apos;inscription intégré (Facebook Login for Business)
                pour connecter votre numéro WhatsApp Business
              </li>
              <li>
                Une fois connecté, les messages de vérification seront envoyés
                automatiquement aux commandes en statut VÉRIFIER
              </li>
            </ol>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Flow de vérification
            </h3>
            <ol className="list-decimal list-inside space-y-2 ml-1">
              <li>Le client reçoit un message WhatsApp avec le résumé de sa commande</li>
              <li>
                Il répond <strong>OUI</strong> pour confirmer ou <strong>NON</strong> pour
                annuler
              </li>
              <li>
                nortoo met à jour la décision automatiquement (Expédier si confirmé,
                Bloquer si annulé)
              </li>
            </ol>

            <InfoBox>
              Les credentials WhatsApp sont chiffrés AES-256-GCM et stockés de manière
              sécurisée. Seul votre compte y a accès.
            </InfoBox>
          </GuideSection>

          {/* ── 10. Facturation ─────────────────────────────── */}
          <GuideSection id="facturation" title="Facturation et plans" icon={CreditCard}>
            <p>nortoo propose 4 plans adaptés à votre volume :</p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-silk text-left text-xs text-fog font-medium">
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Prix</th>
                    <th className="py-2 pr-4">Commandes/mois</th>
                    <th className="py-2 pr-4">Utilisateurs</th>
                    <th className="py-2">Fonctionnalités clés</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-silk/60">
                    <td className="py-2.5 pr-4 font-medium">Trial</td>
                    <td className="py-2.5 pr-4 font-semibold text-mint">Gratuit</td>
                    <td className="py-2.5 pr-4">50</td>
                    <td className="py-2.5 pr-4">1</td>
                    <td className="py-2.5 text-fog">Scoring de base, 30 jours d&apos;essai</td>
                  </tr>
                  <tr className="border-b border-silk/60">
                    <td className="py-2.5 pr-4 font-medium">Starter</td>
                    <td className="py-2.5 pr-4 font-semibold">299 DH <span className="text-fog font-normal text-xs">TTC/mois</span></td>
                    <td className="py-2.5 pr-4">500</td>
                    <td className="py-2.5 pr-4">1</td>
                    <td className="py-2.5 text-fog">CSV export, actions en lot</td>
                  </tr>
                  <tr className="border-b border-silk/60">
                    <td className="py-2.5 pr-4 font-medium">Pro</td>
                    <td className="py-2.5 pr-4 font-semibold">699 DH <span className="text-fog font-normal text-xs">TTC/mois</span></td>
                    <td className="py-2.5 pr-4">2 000</td>
                    <td className="py-2.5 pr-4">3</td>
                    <td className="py-2.5 text-fog">Simulation, poids custom, PDF</td>
                  </tr>
                  <tr className="border-b border-silk/60">
                    <td className="py-2.5 pr-4 font-medium">Scale</td>
                    <td className="py-2.5 pr-4 font-semibold">1 499 DH <span className="text-fog font-normal text-xs">TTC/mois</span></td>
                    <td className="py-2.5 pr-4">Illimité</td>
                    <td className="py-2.5 pr-4">10</td>
                    <td className="py-2.5 text-fog">Multi-utilisateurs, rôles avancés</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Upgrade / Downgrade
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                <strong>Upgrade</strong> — Effectif immédiatement, facturé au prorata
              </li>
              <li>
                <strong>Downgrade</strong> — Prend effet à la fin de la période de
                facturation en cours
              </li>
            </ul>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Paiement
            </h3>
            <p>
              Le paiement se fait par <strong>virement bancaire</strong>. Les coordonnées
              bancaires vous sont envoyées par email après la souscription. Votre plan est
              activé dès réception du virement.
            </p>
          </GuideSection>

          {/* ── 11. Conformité ──────────────────────────────── */}
          <GuideSection id="conformite" title="Conformité Loi 09-08" icon={Shield}>
            <p>
              nortoo est conforme à la{" "}
              <strong>Loi n° 09-08 relative à la protection des personnes physiques
              à l&apos;égard du traitement des données à caractère personnel</strong>.
            </p>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Mesures de protection
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>
                <strong>Numéros de téléphone hachés</strong> — Les numéros sont hachés en
                SHA-256 et ne sont jamais stockés en clair
              </li>
              <li>
                <strong>Données hébergées en UE</strong> — Serveurs à Francfort (Allemagne),
                conformes RGPD
              </li>
              <li>
                <strong>Journal d&apos;audit</strong> — Toutes les actions sont tracées
                (Art. 23 Loi 09-08)
              </li>
              <li>
                <strong>Rétention 24 mois</strong> — Les données sont conservées 24 mois
                maximum, puis supprimées (Art. 3e)
              </li>
              <li>
                <strong>Isolation par marchand</strong> — Chaque marchand ne voit que ses
                propres données (multi-tenant strict)
              </li>
            </ul>

            <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
              Droits des personnes concernées
            </h3>
            <p>
              Conformément aux articles 7, 8 et 9 de la Loi 09-08, toute personne peut
              exercer ses droits :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>
                <strong>Droit d&apos;accès</strong> — Demander quelles données sont
                détenues
              </li>
              <li>
                <strong>Droit de rectification</strong> — Corriger des données inexactes
              </li>
              <li>
                <strong>Droit de suppression</strong> — Demander la suppression des données
              </li>
              <li>
                <strong>Droit d&apos;opposition</strong> — S&apos;opposer au traitement
              </li>
            </ul>
            <p className="mt-3">
              Les demandes peuvent être soumises via le{" "}
              <Link href="/data-rights" className="text-mint underline">
                formulaire de droits des données
              </Link>{" "}
              ou par email à{" "}
              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                support@nortoo.ma
              </span>
              .
            </p>

            <InfoBox>
              Le journal d&apos;audit complet est accessible dans{" "}
              <Link href="/dashboard/compliance" className="text-mint underline">
                Conformité
              </Link>
              .
            </InfoBox>
          </GuideSection>

          {/* ── 12. FAQ ─────────────────────────────────────── */}
          <GuideSection id="faq" title="Questions fréquentes" icon={HelpCircle}>
            <div className="space-y-6">
              <FaqItem q="Pourquoi ma commande a-t-elle été bloquée ?">
                Ouvrez le détail de la commande pour voir la décomposition du score. Chaque
                règle qui a contribué au score est listée avec ses points. Si le score
                dépasse votre seuil de blocage (86 par défaut), la commande est bloquée.
                Vous pouvez toujours forcer l&apos;expédition via un override manuel.
              </FaqItem>

              <FaqItem q="Puis-je modifier la décision d'une commande ?">
                Oui. Depuis le détail de la commande, utilisez les boutons &quot;Forcer
                l&apos;expédition&quot; ou &quot;Forcer le blocage&quot;. L&apos;action est
                enregistrée dans le journal d&apos;audit.
              </FaqItem>

              <FaqItem q="Le scoring est-il fiable pour un nouveau marchand ?">
                Au démarrage, l&apos;indice de confiance est plus bas (0.40) car nortoo
                n&apos;a pas encore d&apos;historique sur vos clients. La fiabilité augmente
                rapidement avec le volume de commandes. Après quelques semaines, les données
                de vélocité, géographie et produit affinent considérablement le scoring.
              </FaqItem>

              <FaqItem q="Mon webhook ne fonctionne pas, que faire ?">
                Vérifiez le point de santé du webhook (indicateur vert/rouge dans le header
                du dashboard). Si le point est rouge : (1) vérifiez que votre boutique
                YouCan est toujours connectée dans Paramètres &gt; Boutique, (2) relancez
                le test webhook depuis l&apos;onboarding. Contactez{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  support@nortoo.ma
                </span>{" "}
                si le problème persiste.
              </FaqItem>

              <FaqItem q="Comment ajouter un membre à mon équipe ?">
                Allez dans{" "}
                <Link
                  href="/dashboard/settings?tab=team"
                  className="text-mint underline"
                >
                  Paramètres &gt; Équipe
                </Link>
                , entrez l&apos;email du collaborateur et choisissez son rôle. Il recevra
                un email d&apos;invitation. Le nombre d&apos;utilisateurs dépend de votre
                plan (1 pour Starter, 3 pour Pro, 10 pour Scale).
              </FaqItem>

              <FaqItem q="Puis-je utiliser nortoo avec une plateforme autre que YouCan ?">
                Oui. Utilisez l&apos;endpoint d&apos;ingestion API (
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  POST /api/webhook/ingest
                </span>
                ) pour envoyer vos commandes depuis n&apos;importe quelle plateforme.
                Consultez la section{" "}
                <button
                  onClick={() =>
                    document.getElementById("api")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-mint underline"
                >
                  Intégration API
                </button>{" "}
                ci-dessus.
              </FaqItem>

              <FaqItem q="Comment contacter le support ?">
                Envoyez un email à{" "}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  support@nortoo.ma
                </span>
                . Nous répondons en moins de 24 heures.
              </FaqItem>
            </div>
          </GuideSection>
        </div>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-6 lg:bottom-8 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-mint text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/* ─── FAQ Item ───────────────────────────────────────────── */

function FaqItem({
  q,
  children,
}: {
  q: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-medium text-midnight mb-1">{q}</p>
      <p className="text-fog">{children}</p>
    </div>
  );
}
