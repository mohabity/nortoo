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
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { GuideSection, Tip, Warning, InfoBox, CodeBlock } from "./callouts";
import { ScoreRangeBar, RuleTable } from "./score-visuals";
import {
  DashboardMockup,
  OrdersPageMockup,
  OrderDetailMockup,
  ScoringFlowDiagram,
  SettingsTabsMockup,
  OnboardingStepsMockup,
  AnalyticsMockup,
} from "./mockups";
import { FaqItem } from "./faq-item";

export function GuideSections() {
  return (
    <>
      {/* ── 1. Bienvenue ────────────────────────────────── */}
      <GuideSection id="bienvenue" title="Bienvenue sur nortoo" icon={BookOpen}>
        <p>
          <strong>nortoo</strong> (No RTO) est une plateforme de scoring anti-fraude
          pour le e-commerce COD (Cash-on-Delivery) au Maroc.
        </p>
        <p>
          Au Maroc, <strong>30 à 50 % des commandes COD échouent</strong> (refus de
          réception, fausses coordonnées, récidivistes). Chaque commande retournée
          coûte en moyenne <strong>40 à 80 DH en frais de livraison perdus</strong>,
          sans compter le coût du produit, de l&apos;emballage et du temps perdu.
        </p>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Comment ça marche ?
        </h3>
        <p>
          nortoo analyse chaque commande entrante en temps réel et lui attribue un{" "}
          <strong>score de risque de 0 à 100</strong> basé sur <strong>24 règles</strong> réparties
          en 8 catégories (historique client, vélocité, montant, géographie, qualité d&apos;adresse,
          nom, produit, temporalité).
        </p>
        <p>Selon ce score, la commande est automatiquement classée :</p>
        <ScoreRangeBar />

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Aperçu du dashboard
        </h3>
        <p className="mb-3">
          Voici à quoi ressemble votre tableau de bord une fois connecté. Les KPIs, le graphique
          d&apos;évolution et les commandes récentes s&apos;affichent en temps réel.
        </p>
        <DashboardMockup />

        <Tip>
          Vous pouvez personnaliser les seuils de décision dans{" "}
          <Link href="/dashboard/settings?tab=scoring" className="text-mint underline">
            Paramètres &gt; Scoring
          </Link>
          . Par exemple, baisser le seuil de vérification à 25 pour être plus strict.
        </Tip>
      </GuideSection>

      {/* ── 2. Premiers pas ─────────────────────────────── */}
      <GuideSection id="premiers-pas" title="Premiers pas" icon={Rocket}>
        <p>Pour commencer avec nortoo, suivez ces 5 étapes :</p>

        <OnboardingStepsMockup />

        <ol className="list-decimal list-inside space-y-4 ml-1 mt-4">
          <li>
            <strong>Créez votre compte</strong> — Inscrivez-vous sur{" "}
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              app.nortoo.ma/register
            </span>
            . Vous démarrez avec un <strong>essai gratuit de 30 jours</strong> (50 commandes incluses).
            Aucune carte bancaire n&apos;est requise.
          </li>
          <li>
            <strong>Connectez votre boutique YouCan</strong> — Lors de l&apos;onboarding,
            cliquez sur &quot;Connecter ma boutique&quot; pour autoriser nortoo via OAuth.
            La connexion se fait en un clic : vous êtes redirigé vers YouCan pour autoriser
            l&apos;accès, puis renvoyé sur nortoo. Le webhook{" "}
            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              order.create
            </span>{" "}
            est configuré automatiquement.
          </li>
          <li>
            <strong>Choisissez un preset de scoring</strong> — Trois profils prédéfinis adaptés
            à différentes stratégies :
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2 text-fog">
              <li>
                <strong className="text-slate">Permissif</strong> — Seuils hauts (vérifier: 45, signaler: 75, bloquer: 90).
                Laisse passer plus de commandes. Idéal au démarrage ou si vous avez un faible taux RTO.
              </li>
              <li>
                <strong className="text-slate">Équilibré</strong> — Seuils standards (vérifier: 31, signaler: 66, bloquer: 86).
                Bon compromis risque/conversion. <strong>Recommandé</strong> pour la majorité des boutiques.
              </li>
              <li>
                <strong className="text-slate">Conservateur</strong> — Seuils bas (vérifier: 25, signaler: 55, bloquer: 80).
                Bloque davantage et minimise les pertes. Pour les boutiques avec un taux RTO élevé.
              </li>
            </ul>
          </li>
          <li>
            <strong>Testez le webhook</strong> — nortoo envoie un ping de test pour
            vérifier que la connexion fonctionne. Un indicateur vert/rouge apparaît dans
            le header du dashboard pour confirmer l&apos;état du webhook.
          </li>
          <li>
            <strong>C&apos;est prêt !</strong> — Vos commandes arrivent en temps réel
            sur le dashboard. Chaque nouvelle commande est scorée et classée automatiquement.
          </li>
        </ol>

        <InfoBox>
          Un <strong>checklist de démarrage</strong> apparaît sur votre dashboard (visible ci-dessous)
          tant que toutes les étapes ne sont pas complétées. Il disparaît automatiquement une fois
          que vous avez reçu vos 10 premières commandes.
        </InfoBox>

        <Warning>
          Si vous utilisez une plateforme <strong>autre que YouCan</strong> (WooCommerce, Shopify, custom...),
          passez directement à la section{" "}
          <button
            onClick={() =>
              document.getElementById("api")?.scrollIntoView({ behavior: "smooth" })
            }
            className="text-mint underline"
          >
            Intégration API
          </button>{" "}
          pour configurer l&apos;envoi des commandes via l&apos;API REST.
        </Warning>
      </GuideSection>

      {/* ── 3. Dashboard ────────────────────────────────── */}
      <GuideSection id="dashboard" title="Dashboard" icon={LayoutDashboard}>
        <p>
          Le dashboard est votre vue d&apos;ensemble. Il affiche en temps réel les
          indicateurs clés de votre boutique, mis à jour automatiquement à chaque
          nouvelle commande.
        </p>

        <DashboardMockup />

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          KPIs principaux (4 cartes)
        </h3>
        <p className="mb-2">
          Les 4 cartes en haut du dashboard affichent vos métriques clés avec
          l&apos;évolution par rapport à la période précédente :
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li>
            <strong>Économies réalisées</strong> — Montant total économisé grâce aux
            commandes bloquées. Calculé selon le coût RTO configuré dans vos paramètres
            (par défaut : 50 DH par commande bloquée).
          </li>
          <li>
            <strong>Score moyen</strong> — Score de risque moyen de toutes vos commandes
            sur la période. Un score moyen bas (&lt; 30) signifie que vos clients sont
            globalement fiables.
          </li>
          <li>
            <strong>Taux de livraison</strong> — Pourcentage de commandes livrées avec
            succès (statut SHIP ou override marchand). Objectif : &gt; 75%.
          </li>
          <li>
            <strong>Commandes bloquées</strong> — Nombre de commandes interceptées
            automatiquement par le scoring (score &gt; seuil de blocage).
          </li>
        </ul>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Graphique d&apos;évolution
        </h3>
        <p>
          Le graphique en aire affiche l&apos;évolution jour par jour du nombre de
          commandes et du score moyen. Les données couvrent les 30 derniers jours.
          Survolez les points pour voir les détails de chaque journée (nombre de commandes,
          score moyen, taux de blocage).
        </p>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Bannière d&apos;économies
        </h3>
        <p>
          Si vos économies dépassent 500 DH, une bannière verte apparaît en haut du
          dashboard avec le montant total économisé et le multiple ROI. Vous pouvez
          la masquer pendant 7 jours en cliquant sur le bouton de fermeture.
        </p>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Widget urgences
        </h3>
        <p>
          Les commandes en statut <strong>VÉRIFIER</strong> qui n&apos;ont pas encore
          été traitées apparaissent dans le widget d&apos;urgences. Chaque commande
          affiche un <strong>compte à rebours</strong> basé sur le délai d&apos;escalade
          configuré dans vos paramètres (par défaut : 4 heures).
        </p>
        <p>
          Les commandes sont triées par priorité (P1 à P5) basée sur le montant et
          le temps restant. Les commandes en dépassement d&apos;escalade sont marquées
          en rouge.
        </p>

        <Warning>
          Traitez les urgences rapidement ! Après le délai d&apos;escalade, la commande
          passe automatiquement en statut &quot;Escaladée&quot; et peut nécessiter une action
          manuelle.
        </Warning>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Commandes récentes
        </h3>
        <p>
          Le tableau en bas du dashboard affiche les 10 dernières commandes reçues avec
          leur score, décision et informations client. Cliquez sur une ligne pour
          ouvrir le panneau de détail. Sur mobile, les commandes s&apos;affichent en
          format carte.
        </p>

        <Tip>
          Le bouton de rafraîchissement en haut à droite synchronise manuellement
          les données avec votre boutique YouCan. Le dashboard se rafraîchit aussi
          automatiquement à chaque nouveau webhook reçu.
        </Tip>
      </GuideSection>

      {/* ── 4. Commandes ────────────────────────────────── */}
      <GuideSection id="commandes" title="Commandes" icon={ShoppingCart}>
        <p>
          La page{" "}
          <Link href="/dashboard/orders" className="text-mint underline">
            Commandes
          </Link>{" "}
          affiche toutes vos commandes avec leur score, décision et statut pipeline.
          C&apos;est la page centrale pour gérer vos commandes au quotidien.
        </p>

        <OrdersPageMockup />

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Filtres par décision
        </h3>
        <p className="mb-2">
          Les pilules colorées en haut de la page permettent de filtrer par décision.
          Le compteur entre parenthèses indique le nombre de commandes dans chaque catégorie :
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs px-2.5 py-1 rounded-full bg-midnight text-white font-medium">Toutes</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-white font-medium">Expédier</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500 text-white font-medium">Vérifier</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500 text-white font-medium">Signaler</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500 text-white font-medium">Bloquer</span>
        </div>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Recherche intelligente
        </h3>
        <p>
          La barre de recherche propose des <strong>suggestions automatiques</strong> au
          fur et à mesure de votre saisie :
        </p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>Recherchez par <strong>nom du client</strong>, <strong>ville</strong>, <strong>produit</strong> ou <strong>numéro de commande</strong></li>
          <li>Les suggestions sont groupées par catégorie avec une icône distincte</li>
          <li>Vos 5 dernières recherches sont mémorisées pour un accès rapide</li>
          <li>Raccourci clavier : <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">Ctrl+K</span> pour ouvrir la recherche</li>
        </ul>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Statut pipeline
        </h3>
        <p>
          En plus de la décision de scoring, chaque commande a un <strong>statut pipeline</strong> qui
          reflète son avancement dans le processus :
        </p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li><strong>En attente</strong> — Vient d&apos;arriver, pas encore traitée</li>
          <li><strong>Auto-expédiée</strong> — Score bas, expédiée automatiquement</li>
          <li><strong>À vérifier</strong> — Nécessite une action manuelle</li>
          <li><strong>Escaladée</strong> — Délai d&apos;escalade dépassé</li>
          <li><strong>Auto-bloquée</strong> — Score élevé, bloquée automatiquement</li>
          <li><strong>Override marchand</strong> — Décision forcée manuellement</li>
        </ul>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Détail d&apos;une commande
        </h3>
        <p className="mb-3">
          Cliquez sur une commande pour ouvrir le panneau latéral de détail.
          Il affiche toutes les informations de la commande et la décomposition complète du score :
        </p>

        <OrderDetailMockup />

        <p className="mt-3">Le panneau de détail contient :</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>Le <strong>score</strong> avec un badge coloré et le niveau de risque</li>
          <li>La <strong>décomposition des facteurs</strong> — chaque règle qui a contribué au score, avec les points ajoutés ou retirés et l&apos;explication</li>
          <li>Les <strong>informations client</strong> — nom, téléphone (masqué), ville, adresse</li>
          <li>L&apos;<strong>historique client</strong> — nombre de commandes passées, taux de succès</li>
          <li>La <strong>barre de progression d&apos;escalade</strong> — temps restant avant escalade (pour les commandes VÉRIFIER)</li>
        </ul>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Override manuel
        </h3>
        <p>
          En bas du panneau de détail, deux boutons permettent de forcer la décision :
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li>
            <strong>Forcer l&apos;expédition</strong> (bouton vert) — Expédier malgré un score élevé.
            Utile pour un client VIP que vous connaissez personnellement.
          </li>
          <li>
            <strong>Forcer le blocage</strong> (bouton rouge) — Bloquer malgré un score bas.
            Utile en cas de suspicion non détectée par l&apos;algorithme (ex : message suspect du client).
          </li>
        </ul>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Actions en lot
        </h3>
        <p>
          Sélectionnez plusieurs commandes en cochant les cases à gauche du tableau,
          puis utilisez la barre d&apos;actions en lot qui apparaît en bas de l&apos;écran
          pour forcer l&apos;expédition ou le blocage de toutes les commandes sélectionnées
          en une seule action (plans Starter et supérieurs).
        </p>

        <Warning>
          Les overrides manuels et les actions en lot sont enregistrés dans le journal
          d&apos;audit (Art. 23 Loi 09-08). Ils contribuent aussi à améliorer le scoring
          au fil du temps en enrichissant l&apos;historique client.
        </Warning>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Export CSV
        </h3>
        <p>
          Le bouton d&apos;export en haut à droite permet de télécharger vos commandes
          au format CSV. L&apos;export respecte les filtres actifs (décision, recherche,
          période). Disponible à partir du plan Starter.
        </p>
      </GuideSection>

      {/* ── 5. Scoring ──────────────────────────────────── */}
      <GuideSection id="scoring" title="Le scoring : comment ça marche" icon={Brain}>
        <p>
          Le moteur de scoring analyse chaque commande en temps réel avec{" "}
          <strong>24 règles réparties en 8 catégories</strong>. Chaque règle ajoute ou
          retire des points au score de base de <strong>20</strong>. Le score final
          détermine automatiquement la décision.
        </p>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-3">
          Flux de scoring
        </h3>
        <p className="mb-3">
          Voici le parcours d&apos;une commande à travers le moteur de scoring :
        </p>
        <ScoringFlowDiagram />

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
          vous donne une vision approfondie de la performance de votre boutique avec
          des graphiques détaillés et des tableaux de risque.
        </p>

        <AnalyticsMockup />

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Sélecteur de période
        </h3>
        <p>
          En haut à droite, trois boutons permettent de basculer entre <strong>7 jours</strong>,{" "}
          <strong>30 jours</strong> et <strong>90 jours</strong>. Toutes les métriques et graphiques
          s&apos;adaptent automatiquement à la période sélectionnée.
        </p>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          KPIs économies
        </h3>
        <p>
          Trois cartes récapitulatives en haut de la page :
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li>
            <strong>Total économisé</strong> — Montant cumulé des économies (basé sur le
            coût RTO × nombre de commandes bloquées qui auraient échoué). Inclut un delta
            par rapport à la période précédente.
          </li>
          <li>
            <strong>Commandes sauvées</strong> — Nombre de commandes à haut risque
            interceptées par le scoring avant expédition.
          </li>
          <li>
            <strong>ROI</strong> — Multiple de retour sur investissement : économies ÷
            coût de l&apos;abonnement nortoo. Un ROI de 17× signifie que nortoo vous
            fait économiser 17 fois plus que son coût.
          </li>
        </ul>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Graphiques
        </h3>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li>
            <strong>Tendances RTO</strong> — Graphique en aire montrant l&apos;évolution
            des commandes livrées (vert) vs retournées (rouge). La ligne pointillée
            représente le taux RTO en pourcentage.
          </li>
          <li>
            <strong>Distribution des scores</strong> — Camembert montrant la répartition
            des commandes par niveau de risque (faible/moyen/élevé/critique).
          </li>
          <li>
            <strong>Patterns horaires</strong> — Histogramme des commandes par heure de la
            journée, avec le taux de risque associé. Permet d&apos;identifier les créneaux
            à risque (souvent la nuit).
          </li>
          <li>
            <strong>Répartition des décisions</strong> — Camembert des 4 décisions
            (Expédier/Vérifier/Signaler/Bloquer) avec compteurs.
          </li>
        </ul>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Analyse géographique
        </h3>
        <p>
          Tableau des villes classées par taux RTO. Pour chaque ville : nombre de commandes,
          taux de livraison, taux RTO, score moyen et niveau de risque. Les villes les plus
          risquées sont mises en évidence en rouge.
        </p>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Analyse produit
        </h3>
        <p>
          Tableau des produits les plus commandés avec leur taux RTO individuel.
          Identifiez rapidement quels produits génèrent le plus de retours pour ajuster
          votre catalogue ou votre stratégie.
        </p>

        <h3 className="font-display text-base font-semibold text-midnight mt-6 mb-2">
          Export PDF
        </h3>
        <p>
          Les plans <strong>Pro</strong> et supérieurs peuvent exporter un rapport
          mensuel en PDF. Le rapport contient les KPIs, graphiques, top villes à risque
          et top produits à risque. Idéal pour partager avec votre équipe ou vos
          partenaires logistiques.
        </p>

        <Tip>
          Consultez la page Analytique régulièrement pour identifier les tendances.
          Si le taux RTO d&apos;une ville augmente soudainement, vous pouvez ajuster les
          seuils de scoring spécifiquement pour cette zone.
        </Tip>
      </GuideSection>

      {/* ── 7. Paramètres ───────────────────────────────── */}
      <GuideSection id="parametres" title="Paramètres" icon={Settings}>
        <p>
          La page{" "}
          <Link href="/dashboard/settings" className="text-mint underline">
            Paramètres
          </Link>{" "}
          contient <strong>11 onglets</strong> organisés dans une barre latérale
          (desktop) ou en scroll horizontal (mobile).
        </p>

        <SettingsTabsMockup />

        <div className="space-y-4 mt-6">
          {[
            {
              name: "Profil",
              desc: "Nom du marchand, email de contact, mot de passe, fuseau horaire et langue d'affichage. Les modifications sont sauvegardées instantanément.",
            },
            {
              name: "Boutique",
              desc: "Statut de connexion YouCan (connecté/déconnecté), URL de la boutique, date de dernière synchronisation. Vous pouvez reconnecter votre boutique si le token a expiré.",
            },
            {
              name: "Équipe",
              desc: "Invitez des collaborateurs par email et attribuez-leur un rôle : Admin (accès total), Manager (commandes + analytique), ou Opérateur (commandes seulement). Chaque rôle a des permissions granulaires. Nombre max d'utilisateurs selon le plan (1/1/3/10).",
            },
            {
              name: "Scoring",
              desc: "Ajustez les 3 seuils de décision (Vérifier/Signaler/Bloquer) avec des curseurs visuels. Choisissez un preset (Permissif/Équilibré/Conservateur) ou personnalisez les poids de chaque catégorie de règles. Activez/désactivez le blocage automatique.",
            },
            {
              name: "Escalade",
              desc: "Configurez le délai avant escalade des commandes VÉRIFIER (par défaut : 4 heures). Après ce délai, les commandes passent en statut « Escaladée » et sont mises en avant dans le widget urgences.",
            },
            {
              name: "Coûts RTO",
              desc: "Renseignez le coût moyen d'une commande retournée (frais de livraison aller + retour + emballage). Ce montant est utilisé pour calculer les économies réalisées et le ROI affiché dans Analytique.",
            },
            {
              name: "API",
              desc: "Votre clé API (nt_live_...) avec bouton de copie, URL du webhook, et documentation de l'endpoint d'ingestion. Vous pouvez régénérer votre clé API si nécessaire (l'ancienne est immédiatement révoquée).",
            },
            {
              name: "Notifications",
              desc: "Activez les alertes email pour les événements importants : commande bloquée, commande signalée, escalade dépassée. Configurez les rapports automatiques (quotidien ou hebdomadaire) avec résumé des KPIs.",
            },
            {
              name: "Listes téléphones",
              desc: "Gérez deux listes : liste blanche (numéros toujours autorisés → score = 0, décision = SHIP) et liste noire (numéros toujours bloqués → score = 100, décision = BLOCK). Les numéros sont hachés SHA-256 pour la conformité Loi 09-08.",
            },
            {
              name: "Confidentialité",
              desc: "Durée de rétention des données (24 mois par défaut), référence de déclaration CNDP, activation/désactivation de l'intelligence réseau (nécessite autorisation CNDP Art. 12.1.f).",
            },
            {
              name: "Facturation",
              desc: "Plan actuel avec utilisation du mois en cours (nombre de commandes / quota), historique des factures, boutons upgrade/downgrade avec simulation de prix. Paiement par virement bancaire.",
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

        <Tip>
          L&apos;onglet <strong>Scoring</strong> est le plus important à configurer.
          Commencez par le preset &quot;Équilibré&quot; puis ajustez les seuils après
          2-3 semaines d&apos;utilisation, en fonction de vos résultats réels.
        </Tip>
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

      {/* ── 9. Facturation ──────────────────────────────── */}
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

      {/* ── 10. Conformité ──────────────────────────────── */}
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

      {/* ── 11. FAQ ─────────────────────────────────────── */}
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
    </>
  );
}
