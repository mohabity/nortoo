import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — nortoo",
  description:
    "Comment nortoo collecte, utilise et protège vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#1E293B]">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/nortoo-logo.png" alt="nortoo" className="h-6 w-auto" />
          </Link>
          <nav className="flex gap-4 text-sm text-[#64748B]">
            <Link href="/terms" className="hover:text-[#0B0F1A] transition">
              CGU
            </Link>
            <Link href="/data-rights" className="hover:text-[#0B0F1A] transition">
              Mes données
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#0B0F1A] mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-[#94A3B8] mb-10">
          Dernière mise à jour : mars 2026
        </p>

        <div className="space-y-8 text-[#475569] leading-relaxed text-[0.95rem]">
          {/* 1. Responsable */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              1. Responsable du traitement
            </h2>
            <p>
              Le responsable du traitement des données est la société{" "}
              <strong className="text-[#0B0F1A]">nortoo</strong>, éditrice de la
              plateforme nortoo.ma, domiciliée au Maroc.
            </p>
            <p className="mt-2">
              Contact Délégué à la Protection des Données (DPO) :{" "}
              <a
                href="mailto:support@nortoo.ma"
                className="text-[#059669] hover:underline"
              >
                support@nortoo.ma
              </a>
            </p>
          </section>

          {/* 2. Données collectées */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              2. Données collectées
            </h2>
            <p>
              nortoo collecte et traite les données suivantes dans le cadre de
              son service de scoring anti-fraude :
            </p>
            <div className="mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-medium text-[#0B0F1A]">Catégorie</span>
                <span className="font-medium text-[#0B0F1A]">Données</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Marchand</span>
                <span className="text-[#64748B]">
                  Nom de boutique, ID YouCan, email
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Commandes</span>
                <span className="text-[#64748B]">
                  Référence, montant, produit, date
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Client final</span>
                <span className="text-[#64748B]">
                  Téléphone (haché*), nom, ville, adresse
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Navigation</span>
                <span className="text-[#64748B]">
                  Cookies techniques, langue, IP (anonymisée)
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#94A3B8]">
              * Les numéros de téléphone sont stockés sous forme de hash SHA-256
              irréversible. Seule une version masquée (212XXXXX678) est affichée
              dans l&apos;interface.
            </p>
          </section>

          {/* 3. Finalités */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              3. Finalités du traitement
            </h2>
            <p>Les données sont collectées exclusivement pour :</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Scorer les commandes COD pour détecter les risques de fraude
                (finalité principale)
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Construire un historique client pour améliorer la précision du
                scoring
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Fournir des statistiques agrégées au marchand (taux RTO,
                économies)
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Assurer la sécurité et la traçabilité via les logs d&apos;audit
              </li>
            </ul>
            <p className="mt-3">
              <strong className="text-[#DC2626]">
                nortoo ne vend ni ne transfère jamais les données personnelles à
                des tiers.
              </strong>
            </p>
          </section>

          {/* 4. Base légale */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              4. Base légale (Art. 4, Loi 09-08)
            </h2>
            <p>Le traitement est fondé sur :</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">
                  Le consentement du marchand
                </strong>{" "}
                — obtenu lors de l&apos;installation de l&apos;application via
                l&apos;OAuth YouCan
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">L&apos;intérêt légitime</strong>{" "}
                — du marchand à protéger son activité contre la fraude
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">
                  L&apos;exécution du contrat
                </strong>{" "}
                — entre nortoo et le marchand pour la fourniture du service de
                scoring
              </li>
            </ul>
          </section>

          {/* 5. Durée de conservation */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              5. Durée de conservation (Art. 3, Loi 09-08)
            </h2>
            <div className="mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-medium text-[#0B0F1A]">Donnée</span>
                <span className="font-medium text-[#0B0F1A]">Durée</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Commandes (PII)</span>
                <span className="text-[#059669]">
                  24 mois, puis anonymisées
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Commandes (stats agrégées)</span>
                <span className="text-[#64748B]">
                  Conservées sans limite (anonymes)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Clients (historique scoring)</span>
                <span className="text-[#059669]">
                  24 mois après dernière activité
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Logs d&apos;audit</span>
                <span className="text-[#64748B]">36 mois</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Cookies techniques</span>
                <span className="text-[#64748B]">Durée de la session</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#94A3B8]">
              Une purge automatique s&apos;exécute le 1er de chaque mois pour
              anonymiser les données expirées.
            </p>
          </section>

          {/* 6. Droits des personnes */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              6. Vos droits (Art. 7-9, Loi 09-08)
            </h2>
            <p>
              Conformément à la Loi 09-08, vous disposez des droits suivants :
            </p>
            <ul className="mt-2 space-y-2 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">
                  Droit d&apos;accès (Art. 7)
                </strong>{" "}
                — Obtenir une copie des données vous concernant
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">
                  Droit de rectification (Art. 8)
                </strong>{" "}
                — Corriger des données inexactes
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">
                  Droit d&apos;opposition / suppression (Art. 9)
                </strong>{" "}
                — Demander la suppression de vos données
              </li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits :{" "}
              <Link
                href="/data-rights"
                className="text-[#059669] hover:underline font-medium"
              >
                formulaire en ligne →
              </Link>{" "}
              ou par email à{" "}
              <a
                href="mailto:support@nortoo.ma"
                className="text-[#059669] hover:underline"
              >
                support@nortoo.ma
              </a>
              .
            </p>
            <p className="mt-2 text-sm text-[#94A3B8]">
              Délai de réponse : 10 jours ouvrables maximum (Art. 7, Loi
              09-08).
            </p>
          </section>

          {/* 7. Sécurité */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              7. Mesures de sécurité (Art. 23-24, Loi 09-08)
            </h2>
            <p>
              nortoo met en œuvre les mesures suivantes pour protéger vos
              données :
            </p>
            <ul className="mt-2 space-y-1 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Chiffrement HTTPS sur toutes les communications
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Hash SHA-256 des numéros de téléphone (irréversible)
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Chiffrement AES-256-GCM des tokens d&apos;accès
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Authentification par cookies signés + vérification HMAC
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Logs d&apos;audit immuables pour toute action sensible
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Rate limiting sur toutes les API
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                Monitoring temps réel via Sentry (sans PII)
              </li>
            </ul>
          </section>

          {/* 8. Transfert international */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              8. Transfert international (Art. 43-44, Loi 09-08)
            </h2>
            <p>
              Les données sont hébergées sur des serveurs situés dans
              l&apos;Union Européenne (région Frankfurt, Allemagne) via :
            </p>
            <ul className="mt-2 space-y-1 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">Vercel</strong> — hébergement de
                l&apos;application (Edge Network EU)
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#059669]">
                <strong className="text-[#0B0F1A]">Neon</strong> — base de données
                PostgreSQL (Frankfurt, Allemagne)
              </li>
            </ul>
            <p className="mt-2">
              Ce transfert est déclaré dans le formulaire CNDP conformément aux
              articles 43 et 44 de la Loi 09-08. L&apos;UE dispose d&apos;un
              niveau de protection adéquat reconnu.
            </p>
          </section>

          {/* 9. Cookies */}
          <section id="cookies">
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              9. Cookies
            </h2>
            <p>
              nortoo utilise uniquement des{" "}
              <strong className="text-[#0B0F1A]">
                cookies techniques strictement nécessaires
              </strong>{" "}
              au fonctionnement :
            </p>
            <div className="mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-medium text-[#0B0F1A]">Cookie</span>
                <span className="font-medium text-[#0B0F1A]">Finalité</span>
                <span className="font-medium text-[#0B0F1A]">Durée</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-mono text-xs">nortoo_session</span>
                <span className="text-[#64748B]">Authentification</span>
                <span className="text-[#64748B]">30 jours</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-mono text-xs">nortoo_lang</span>
                <span className="text-[#64748B]">Préférence de langue</span>
                <span className="text-[#64748B]">1 an</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-mono text-xs">nortoo_cookies</span>
                <span className="text-[#64748B]">Consentement cookies</span>
                <span className="text-[#64748B]">1 an</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#94A3B8]">
              Aucun cookie publicitaire, analytique ou de tracking n&apos;est
              utilisé.
            </p>
          </section>

          {/* 10. CNDP */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              10. Déclaration CNDP
            </h2>
            <p>
              Le traitement des données par nortoo fait l&apos;objet d&apos;une
              déclaration préalable auprès de la Commission Nationale de
              contrôle de la protection des Données à caractère Personnel
              (CNDP), conformément aux articles 12 à 15 de la Loi 09-08.
            </p>
            <p className="mt-2">
              Numéro de déclaration :{" "}
              <span className="font-mono text-[#059669]">
                [À compléter après déclaration]
              </span>
            </p>
          </section>

          {/* 11. Contact */}
          <section>
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-3">
              11. Contact & réclamation
            </h2>
            <p>
              Pour toute question relative à vos données personnelles :{" "}
              <a
                href="mailto:support@nortoo.ma"
                className="text-[#059669] hover:underline"
              >
                support@nortoo.ma
              </a>
            </p>
            <p className="mt-2">
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              adresser une réclamation à la CNDP :{" "}
              <a
                href="https://www.cndp.ma"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#059669] hover:underline"
              >
                www.cndp.ma
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] px-6 py-6 mt-12">
        <div className="max-w-3xl mx-auto flex justify-between text-sm text-[#94A3B8]">
          <span>© {new Date().getFullYear()} nortoo</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-[#059669] font-medium">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-[#0B0F1A] transition">
              CGU
            </Link>
            <Link href="/data-rights" className="hover:text-[#0B0F1A] transition">
              Mes données
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
