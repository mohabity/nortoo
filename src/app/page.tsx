import {
  Shield,
  TrendingUp,
  Plug,
  BarChart3,
  Zap,
  Lock,
  FileText,
  ChevronRight,
  Check,
  ArrowRight,
} from "lucide-react";

const APP_URL = "https://app.nortoo.ma";

/**
 * Landing page — nortoo · Scoring anti-fraude COD · Maroc
 * Served on nortoo.ma — all app links point to app.nortoo.ma
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#E2E8F0]">
      {/* ═══ Navbar ═══ */}
      <nav className="border-b border-[#1E293B] px-6 py-4 sticky top-0 bg-[#0B0F1A]/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/nortoo-logo.png" alt="nortoo" className="h-7 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#94A3B8]">
            <a href="#features" className="hover:text-white transition">Fonctionnalit&eacute;s</a>
            <a href="#pricing" className="hover:text-white transition">Tarifs</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <a href={`${APP_URL}/login`} className="hover:text-white transition">Connexion</a>
            <a
              href={`${APP_URL}/register`}
              className="bg-[#00E5A0] text-[#0B0F1A] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#00C78A] transition"
            >
              Commencer
            </a>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <a href={`${APP_URL}/login`} className="text-sm text-[#94A3B8] hover:text-white">Connexion</a>
            <a
              href={`${APP_URL}/register`}
              className="bg-[#00E5A0] text-[#0B0F1A] px-3 py-1.5 rounded-lg font-semibold text-xs"
            >
              Commencer
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 text-[#00E5A0] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#00E5A0]/20">
            <Lock className="w-3 h-3" />
            Conforme Loi 09-08 &middot; Donn&eacute;es h&eacute;berg&eacute;es en UE
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            Bloquez la fraude COD,<br />
            <span className="text-[#00E5A0]">exp&eacute;diez en confiance.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            30 &agrave; 50% des commandes COD &eacute;chouent au Maroc.
            nortoo score chaque commande de 0 &agrave; 100 et vous dit lesquelles exp&eacute;dier.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`${APP_URL}/api/auth/youcan?mode=register`}
              className="inline-flex items-center justify-center gap-2 bg-[#5C6AC4] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#4F5BB5] transition text-sm"
            >
              <Plug className="w-4 h-4" />
              Commencer avec YouCan
            </a>
            <a
              href={`${APP_URL}/register`}
              className="inline-flex items-center justify-center gap-2 border border-[#334155] text-[#E2E8F0] px-6 py-3.5 rounded-xl font-semibold hover:bg-[#1E293B] transition text-sm"
            >
              Cr&eacute;er un compte
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Social proof ═══ */}
      <section className="px-6 py-12 border-y border-[#1E293B]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-black text-white">13</p>
            <p className="text-sm text-[#64748B] mt-1">R&egrave;gles de scoring</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#00E5A0]">&minus;50%</p>
            <p className="text-sm text-[#64748B] mt-1">de RTO en moyenne</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-white">0-100</p>
            <p className="text-sm text-[#64748B] mt-1">Score par commande</p>
          </div>
        </div>
      </section>

      {/* ═══ Comment &ccedil;a marche ═══ */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
            Comment &ccedil;a marche
          </h2>
          <p className="text-[#64748B] text-center mb-12 max-w-lg mx-auto">
            En 3 &eacute;tapes, passez de 50% de RTO &agrave; un taux ma&icirc;tris&eacute;.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: <Plug className="w-6 h-6" />,
                title: "Connectez votre boutique",
                desc: "Installez nortoo depuis le YouCan App Store. L\u2019int\u00e9gration se fait en 2 minutes via OAuth.",
              },
              {
                step: "2",
                icon: <Shield className="w-6 h-6" />,
                title: "Chaque commande est scor\u00e9e",
                desc: "13 r\u00e8gles analysent le client, le montant, la ville, l\u2019adresse et l\u2019historique. Score 0 (s\u00fbr) \u00e0 100 (frauduleux).",
              },
              {
                step: "3",
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Exp\u00e9diez en confiance",
                desc: "Recevez une d\u00e9cision claire : Exp\u00e9dier, V\u00e9rifier, Signaler ou Bloquer. Votre RTO chute.",
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-[#1E293B]/50 rounded-2xl p-6 border border-[#334155]/50">
                <div className="w-10 h-10 rounded-xl bg-[#00E5A0]/10 text-[#00E5A0] flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#0B0F1A] border border-[#334155] flex items-center justify-center text-xs font-bold text-[#64748B]">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="px-6 py-20 bg-[#0F172A]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
            Tout ce qu&apos;il faut pour lutter contre la fraude COD
          </h2>
          <p className="text-[#64748B] text-center mb-12 max-w-lg mx-auto">
            Un outil complet, con&ccedil;u sp&eacute;cifiquement pour le march&eacute; marocain.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Scoring 13 r\u00e8gles",
                desc: "Client fiable, r\u00e9cidiviste, montant, zone risque, adresse suspecte, heure nocturne\u2026",
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Dashboard temps r\u00e9el",
                desc: "KPIs, graphiques, table de commandes avec d\u00e9tails de scoring en un clic.",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "D\u00e9cisions automatiques",
                desc: "Seuils personnalisables : SHIP (0-30), VERIFY (31-65), FLAG (66-85), BLOCK (86-100).",
              },
              {
                icon: <Plug className="w-5 h-5" />,
                title: "Int\u00e9gration YouCan",
                desc: "Webhook automatique. Chaque commande COD est scor\u00e9e d\u00e8s sa cr\u00e9ation.",
              },
              {
                icon: <Lock className="w-5 h-5" />,
                title: "Conforme Loi 09-08",
                desc: "T\u00e9l\u00e9phones hash\u00e9s SHA-256, audit log, droits d\u2019acc\u00e8s/suppression, CNDP.",
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: "Rapports & exports",
                desc: "Rapport hebdomadaire par email, export CSV, rapport PDF mensuel.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-[#1E293B]/30 rounded-xl p-5 border border-[#334155]/30 hover:border-[#00E5A0]/30 transition">
                <div className="w-9 h-9 rounded-lg bg-[#00E5A0]/10 text-[#00E5A0] flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section id="pricing" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
            Tarifs simples, sans surprise
          </h2>
          <p className="text-[#64748B] text-center mb-12 max-w-lg mx-auto">
            Commencez gratuitement. Payez uniquement quand vous grandissez.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Essai",
                price: "0",
                label: "14 jours gratuits",
                orders: "50 commandes/mois",
                users: "1 utilisateur",
                features: ["Scoring anti-fraude", "Dashboard", "Recherche"],
                cta: "Essayer gratuitement",
                highlight: false,
              },
              {
                name: "Starter",
                price: "299",
                label: "DH/mois",
                orders: "500 commandes/mois",
                users: "1 utilisateur",
                features: ["Scoring anti-fraude", "Dashboard", "Recherche", "Export CSV", "Actions en lot"],
                cta: "Choisir Starter",
                highlight: false,
              },
              {
                name: "Pro",
                price: "699",
                label: "DH/mois",
                orders: "2 000 commandes/mois",
                users: "3 utilisateurs",
                features: [
                  "Scoring anti-fraude",
                  "Dashboard",
                  "Recherche",
                  "Export CSV",
                  "Actions en lot",
                  "Simulation scoring",
                  "Pond\u00e9ration custom",
                  "Rapport PDF mensuel",
                ],
                cta: "Choisir Pro",
                highlight: true,
              },
              {
                name: "Scale",
                price: "1 499",
                label: "DH/mois",
                orders: "Illimit\u00e9",
                users: "10 utilisateurs",
                features: [
                  "Tout Pro +",
                  "Multi-utilisateurs",
                  "Gestion des r\u00f4les",
                  "Support prioritaire",
                ],
                cta: "Choisir Scale",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-[#00E5A0]/5 border-2 border-[#00E5A0]/40 relative"
                    : "bg-[#1E293B]/30 border border-[#334155]/50"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00E5A0] text-[#0B0F1A] text-xs font-bold px-3 py-1 rounded-full">
                    Populaire
                  </div>
                )}
                <h3 className="font-bold text-white text-lg mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-sm text-[#64748B] ml-1">{plan.label}</span>
                </div>
                <div className="text-xs text-[#94A3B8] space-y-1 mb-4">
                  <p>{plan.orders}</p>
                  <p>{plan.users}</p>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#CBD5E1]">
                      <Check className="w-3.5 h-3.5 text-[#00E5A0] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`${APP_URL}/register`}
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-[#00E5A0] text-[#0B0F1A] hover:bg-[#00C78A]"
                      : "border border-[#334155] text-[#E2E8F0] hover:bg-[#1E293B]"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="px-6 py-20 bg-[#0F172A]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Questions fr&eacute;quentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Comment fonctionne le scoring ?",
                a: "Chaque commande COD est analys\u00e9e par 13 r\u00e8gles : historique client, montant, ville, adresse, heure, etc. Le r\u00e9sultat est un score de 0 (s\u00fbr) \u00e0 100 (suspect). Vous d\u00e9finissez les seuils de d\u00e9cision.",
              },
              {
                q: "Est-ce compatible avec ma boutique YouCan ?",
                a: "Oui. L\u2019installation se fait en 2 minutes via le YouCan App Store. nortoo re\u00e7oit automatiquement chaque commande COD via webhook et la score en temps r\u00e9el.",
              },
              {
                q: "Mes donn\u00e9es sont-elles prot\u00e9g\u00e9es ?",
                a: "Absolument. nortoo est conforme \u00e0 la Loi 09-08. Les t\u00e9l\u00e9phones sont hash\u00e9s SHA-256, les donn\u00e9es sont h\u00e9berg\u00e9es en UE (Frankfurt), et un audit log tra\u00e7ant chaque action est tenu.",
              },
              {
                q: "Puis-je personnaliser les seuils ?",
                a: "Oui. Depuis le dashboard, vous pouvez ajuster les seuils SHIP/VERIFY/FLAG/BLOCK, activer des presets par secteur, et m\u00eame personnaliser le poids de chaque r\u00e8gle (plan Pro+).",
              },
              {
                q: "Comment est factur\u00e9 le service ?",
                a: "Par virement bancaire mensuel. Une facture est g\u00e9n\u00e9r\u00e9e automatiquement avec TVA 20%. L\u2019essai de 14 jours est totalement gratuit, sans carte bancaire.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-[#1E293B]/30 rounded-xl border border-[#334155]/30 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium text-white hover:bg-[#1E293B]/50 transition list-none">
                  {item.q}
                  <ChevronRight className="w-4 h-4 text-[#64748B] transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="px-6 pb-4 text-sm text-[#94A3B8] leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA final ═══ */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Pr&ecirc;t &agrave; r&eacute;duire votre RTO ?
          </h2>
          <p className="text-[#94A3B8] mb-8">
            Commencez avec 14 jours d&apos;essai gratuit. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`${APP_URL}/register`}
              className="inline-flex items-center justify-center gap-2 bg-[#00E5A0] text-[#0B0F1A] px-6 py-3.5 rounded-xl font-bold hover:bg-[#00C78A] transition text-sm"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-[#1E293B] px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/nortoo-logo.png" alt="nortoo" className="h-6 w-auto" />
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Scoring anti-fraude COD pour le e-commerce au Maroc.
              </p>
              <p className="text-xs text-[#475569] mt-2 font-medium" dir="rtl">
                &#x0646;&#x0648; &#x0631;.&#x062A;.&#x0648; &mdash; &#x0632;&#x064A;&#x0631;&#x0648; &#x0631;&#x062A;&#x0648;&#x0631;
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Produit</h4>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li><a href="#features" className="hover:text-white transition">Fonctionnalit&eacute;s</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">L&eacute;gal</h4>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li><a href="/terms" className="hover:text-white transition">CGU</a></li>
                <li><a href="/privacy" className="hover:text-white transition">Confidentialit&eacute;</a></li>
                <li><a href="/data-rights" className="hover:text-white transition">Mes donn&eacute;es</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-[#64748B]">
                <li><a href="mailto:hello@nortoo.ma" className="hover:text-white transition">hello@nortoo.ma</a></li>
                <li><a href="mailto:support@nortoo.ma" className="hover:text-white transition">support@nortoo.ma</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1E293B] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#475569]">
              &copy; {new Date().getFullYear()} nortoo &middot; Scoring anti-fraude COD &middot; Maroc
            </p>
            <p className="text-xs text-[#334155]">
              Donn&eacute;es h&eacute;berg&eacute;es en UE (Frankfurt) &middot; Conforme Loi 09-08
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
