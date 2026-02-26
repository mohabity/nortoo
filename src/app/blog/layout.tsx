import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | nortoo Blog",
    default: "Blog — nortoo",
  },
  description:
    "Conseils, guides et analyses pour les marchands e-commerce COD au Maroc. Réduisez vos retours, optimisez vos livraisons.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-mint flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B0F1A"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 18V6l12 12V6" />
              </svg>
            </div>
            <span className="text-lg font-display font-bold text-midnight">
              nortoo<span className="text-mint">.</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/blog"
              className="text-sm font-medium text-midnight hover:text-mint transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-gray-500 hover:text-midnight transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="https://app.nortoo.ma/login"
              className="text-sm font-medium px-4 py-2 bg-mint text-midnight rounded-sm hover:bg-mint-dark transition-colors"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-snow mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-mint flex items-center justify-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0B0F1A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M6 18V6l12 12V6" />
                  </svg>
                </div>
                <span className="text-base font-display font-bold text-midnight">
                  nortoo
                </span>
              </Link>
              <p className="text-sm text-gray-500 mt-2 max-w-xs">
                Scoring anti-fraude COD pour le e-commerce au Maroc.
              </p>
            </div>

            <div className="flex gap-12 text-sm">
              <div className="space-y-3">
                <p className="font-semibold text-midnight">Produit</p>
                <Link
                  href="/#features"
                  className="block text-gray-500 hover:text-mint transition-colors"
                >
                  Fonctionnalités
                </Link>
                <Link
                  href="/#pricing"
                  className="block text-gray-500 hover:text-mint transition-colors"
                >
                  Tarifs
                </Link>
                <Link
                  href="/blog"
                  className="block text-gray-500 hover:text-mint transition-colors"
                >
                  Blog
                </Link>
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-midnight">Légal</p>
                <Link
                  href="/terms"
                  className="block text-gray-500 hover:text-mint transition-colors"
                >
                  CGU
                </Link>
                <Link
                  href="/privacy"
                  className="block text-gray-500 hover:text-mint transition-colors"
                >
                  Confidentialité
                </Link>
                <Link
                  href="/data-rights"
                  className="block text-gray-500 hover:text-mint transition-colors"
                >
                  Données personnelles
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} nortoo SARL. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
