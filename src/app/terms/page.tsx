import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — nortoo",
  description: "Conditions régissant l'utilisation du service nortoo.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#E2E8F0]">
      {/* Header */}
      <header className="border-b border-[#1E293B] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            nortoo<span className="text-[#00E5A0]">.</span>
          </Link>
          <nav className="flex gap-4 text-sm text-[#94A3B8]">
            <Link href="/privacy" className="hover:text-white transition">
              Confidentialité
            </Link>
            <Link href="/data-rights" className="hover:text-white transition">
              Mes données
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">
          Conditions Générales d&apos;Utilisation
        </h1>
        <p className="text-sm text-[#64748B] mb-10">
          Dernière mise à jour : mars 2026
        </p>

        <div className="space-y-8 text-[#CBD5E1] leading-relaxed text-[0.95rem]">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (CGU)
              régissent l&apos;accès et l&apos;utilisation de la plateforme
              nortoo (ci-après « le Service »), un service de scoring
              anti-fraude pour les commandes en contre-remboursement (COD)
              destiné aux marchands e-commerce.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              2. Éditeur du Service
            </h2>
            <p>
              Le Service est édité par la société nortoo, domiciliée au Maroc.
            </p>
            <p className="mt-2">
              Contact :{" "}
              <a
                href="mailto:hello@nortoo.ma"
                className="text-[#00E5A0] hover:underline"
              >
                hello@nortoo.ma
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              3. Acceptation des CGU
            </h2>
            <p>
              En installant l&apos;application nortoo depuis le YouCan App Store
              et en complétant le processus d&apos;authentification OAuth, le
              marchand accepte sans réserve les présentes CGU. Si le marchand
              n&apos;accepte pas ces conditions, il ne doit pas utiliser le
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              4. Description du Service
            </h2>
            <p>nortoo fournit :</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Un scoring automatique de chaque commande COD (score 0-100)
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Des recommandations de décision (expédier, vérifier, signaler,
                bloquer)
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Un dashboard de suivi avec statistiques anti-fraude
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                La possibilité d&apos;ajuster les seuils de scoring
              </li>
            </ul>
            <p className="mt-3 text-sm text-[#64748B]">
              Le score est une aide à la décision. nortoo ne garantit pas la
              détection de 100% des fraudes et n&apos;est pas responsable des
              décisions prises par le marchand.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              5. Obligations du marchand
            </h2>
            <p>Le marchand s&apos;engage à :</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Fournir des informations exactes lors de l&apos;inscription
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Ne pas contourner les mécanismes de sécurité du Service
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Respecter la Loi 09-08 relative à la protection des données
                personnelles de ses propres clients
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Informer ses clients que leurs données sont traitées par un
                sous-traitant (nortoo) à des fins de vérification anti-fraude
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Notifier nortoo dans les meilleurs délais de toute faille de
                sécurité dont il a connaissance
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              6. Obligations de nortoo
            </h2>
            <p>nortoo s&apos;engage à :</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Traiter les données uniquement pour les finalités définies
                (scoring anti-fraude)
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Ne pas vendre, louer ou transférer les données à des tiers
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Mettre en œuvre des mesures de sécurité conformes à l&apos;état
                de l&apos;art
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Notifier le marchand en cas de violation de données dans un
                délai de 72 heures
              </li>
              <li className="before:content-['→'] before:mr-2 before:text-[#00E5A0]">
                Respecter la durée de conservation définie dans la politique de
                confidentialité
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              7. Secret professionnel (Art. 26, Loi 09-08)
            </h2>
            <p>
              Toute personne ayant accès aux données traitées par nortoo est
              tenue au secret professionnel. Les données des commandes, les
              scores, et les informations clients sont confidentiels et ne
              peuvent être divulgués à des tiers non autorisés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              8. Plans et tarification
            </h2>
            <p>
              Les tarifs en vigueur sont affichés sur le site nortoo.ma et dans
              le dashboard. Tout changement de tarification sera communiqué au
              marchand avec un préavis de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              9. Limitation de responsabilité
            </h2>
            <p>
              Le Service est fourni « en l&apos;état ». nortoo ne garantit pas
              l&apos;absence totale de fraude dans les commandes scorées comme
              « à expédier ». Le scoring est une aide à la décision basée sur
              des heuristiques, et la décision finale d&apos;expédition revient
              au marchand.
            </p>
            <p className="mt-2">
              La responsabilité de nortoo est limitée au montant des frais
              d&apos;abonnement payés par le marchand au cours des 12 derniers
              mois.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              10. Résiliation
            </h2>
            <p>
              Le marchand peut résilier son abonnement à tout moment depuis le
              dashboard ou en contactant{" "}
              <a
                href="mailto:hello@nortoo.ma"
                className="text-[#00E5A0] hover:underline"
              >
                hello@nortoo.ma
              </a>
              . À la résiliation, les données sont conservées pendant 30 jours
              puis supprimées conformément à la politique de rétention.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              11. Droit applicable
            </h2>
            <p>
              Les présentes CGU sont régies par le{" "}
              <strong className="text-white">droit marocain</strong>. Tout
              litige sera soumis à la juridiction compétente de Casablanca,
              Maroc.
            </p>
            <p className="mt-2">
              En matière de protection des données personnelles, la{" "}
              <strong className="text-white">Loi n° 09-08</strong>{" "}
              s&apos;applique.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] px-6 py-6 mt-12">
        <div className="max-w-3xl mx-auto flex justify-between text-sm text-[#64748B]">
          <span>© {new Date().getFullYear()} nortoo</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition">
              Confidentialité
            </Link>
            <Link href="/terms" className="text-[#00E5A0]">
              CGU
            </Link>
            <Link href="/data-rights" className="hover:text-white transition">
              Mes données
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
