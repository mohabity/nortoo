"use client";

import { useState, useEffect, useRef } from "react";
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
  Smartphone,
} from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const APP_URL = "https://app.nortoo.ma";

/* ── Scroll-triggered fade-in hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/**
 * Landing page — nortoo · COD fraud scoring · Morocco
 * Served on nortoo.ma — all app links point to app.nortoo.ma
 * Bilingual (FR/EN) via useTranslation() · Dark premium theme
 */
export default function Home() {
  const { t, locale } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [statsRef, statsInView] = useInView();
  const [howRef, howInView] = useInView();
  const [featRef, featInView] = useInView();
  const [pricingRef, pricingInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* ═══ Navbar — Dark glassmorphism ═══ */}
      <nav className="border-b border-white/10 px-6 py-4 sticky top-0 bg-[#0B0F1A]/80 backdrop-blur-xl z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/nortoo-logo.png" alt="nortoo" className="h-7 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition">{t("landing.nav.features")}</a>
            <a href="#pricing" className="hover:text-white transition">{t("landing.nav.pricing")}</a>
            <a href="#faq" className="hover:text-white transition">{t("landing.nav.faq")}</a>
            <LanguageSwitcher />
            <a href={`${APP_URL}/login?lang=${locale}`} className="hover:text-white transition">{t("landing.nav.signIn")}</a>
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="bg-[#00E5A0] text-[#0B0F1A] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#00C78A] hover:scale-105 transition-all duration-200"
            >
              {t("landing.nav.getStarted")}
            </a>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="bg-[#00E5A0] text-[#0B0F1A] px-3 py-1.5 rounded-lg font-semibold text-xs"
            >
              {t("landing.nav.getStarted")}
            </a>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 transition"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "max-h-80 border-t border-white/10" : "max-h-0"
          }`}
        >
          <div className="px-6 py-4 space-y-1">
            <a href="#features" className="block py-2.5 text-sm text-white/50 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
              {t("landing.nav.features")}
            </a>
            <a href="#pricing" className="block py-2.5 text-sm text-white/50 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
              {t("landing.nav.pricing")}
            </a>
            <a href="#faq" className="block py-2.5 text-sm text-white/50 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
              {t("landing.nav.faq")}
            </a>
            <div className="pt-2 border-t border-white/10">
              <a href={`${APP_URL}/login?lang=${locale}`} className="block py-2.5 text-sm text-white/50 hover:text-white transition" onClick={() => setMobileMenuOpen(false)}>
                {t("landing.nav.signIn")}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ Hero — Dark gradient + animated blobs ═══ */}
      <section className="relative px-6 py-24 md:py-36 overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern" />
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-[#00E5A0]/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 -right-32 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00E5A0]/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 glass text-white/80 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Lock className="w-3.5 h-3.5 text-[#00E5A0]" />
            {t("landing.hero.badge")}
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            {t("landing.hero.titleLine1")}<br />
            <span className="animate-gradient-text">{t("landing.hero.titleLine2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${APP_URL}/api/auth/youcan?mode=register`}
              className="inline-flex items-center justify-center gap-2 bg-[#5C6AC4] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#4F5BB5] hover:scale-105 transition-all duration-200 text-sm shadow-lg shadow-[#5C6AC4]/20"
            >
              <Plug className="w-4 h-4" />
              {t("landing.hero.ctaYoucan")}
            </a>
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:scale-105 transition-all duration-200 text-sm"
            >
              {t("landing.hero.ctaRegister")}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Social proof — Glass cards ═══ */}
      <section ref={statsRef} className="px-6 py-16 border-y border-white/10">
        <div className={`max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 ${statsInView ? "animate-fade-up" : "opacity-0"}`}>
          {[
            { value: "24+", label: t("landing.stats.rules"), accent: false },
            { value: "\u2212\u200950%", label: t("landing.stats.rto"), accent: true },
            { value: "0-100", label: t("landing.stats.score"), accent: false },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-all duration-300">
              <p className={`text-3xl md:text-4xl font-black mb-1 ${stat.accent ? "text-[#00E5A0]" : "text-white"}`}>
                {stat.value}
              </p>
              <p className="text-sm text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ How it works — White section + connector line ═══ */}
      <section ref={howRef} className="px-6 py-24 bg-white text-[#1E293B]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-4">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="text-[#94A3B8] text-center mb-16 max-w-lg mx-auto">
            {t("landing.howItWorks.subtitle")}
          </p>
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#00E5A0] via-[#8B5CF6] to-[#00E5A0] opacity-30" />
            <div className={`grid md:grid-cols-3 gap-8 ${howInView ? "animate-fade-up" : "opacity-0"}`}>
              {[
                { step: "1", icon: <Plug className="w-6 h-6" />, title: t("landing.howItWorks.step1Title"), desc: t("landing.howItWorks.step1Desc"), delay: "" },
                { step: "2", icon: <Shield className="w-6 h-6" />, title: t("landing.howItWorks.step2Title"), desc: t("landing.howItWorks.step2Desc"), delay: "animation-delay-200" },
                { step: "3", icon: <TrendingUp className="w-6 h-6" />, title: t("landing.howItWorks.step3Title"), desc: t("landing.howItWorks.step3Desc"), delay: "animation-delay-400" },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`relative bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,.04)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${howInView ? `animate-fade-up ${item.delay}` : "opacity-0"}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00E5A0]/20 to-[#00E5A0]/5 text-[#059669] flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#00E5A0] text-[#0B0F1A] flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-[#0B0F1A] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Features — Bento grid ═══ */}
      <section id="features" ref={featRef} className="px-6 py-24 bg-[#F8FAFC] text-[#1E293B]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-[#94A3B8] text-center mb-16 max-w-lg mx-auto">
            {t("landing.features.subtitle")}
          </p>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 ${featInView ? "animate-fade-up" : "opacity-0"}`}>
            {[
              { icon: <Shield className="w-5 h-5" />, title: t("landing.features.scoring"), desc: t("landing.features.scoringDesc"), span: "md:col-span-2" },
              { icon: <BarChart3 className="w-5 h-5" />, title: t("landing.features.dashboard"), desc: t("landing.features.dashboardDesc"), span: "" },
              { icon: <Zap className="w-5 h-5" />, title: t("landing.features.decisions"), desc: t("landing.features.decisionsDesc"), span: "" },
              { icon: <Plug className="w-5 h-5" />, title: t("landing.features.integration"), desc: t("landing.features.integrationDesc"), span: "md:col-span-2" },
              { icon: <Lock className="w-5 h-5" />, title: t("landing.features.compliance"), desc: t("landing.features.complianceDesc"), span: "" },
              { icon: <FileText className="w-5 h-5" />, title: t("landing.features.reports"), desc: t("landing.features.reportsDesc"), span: "" },
              { icon: <Smartphone className="w-5 h-5" />, title: t("landing.features.embeddedSignup"), desc: t("landing.features.embeddedSignupDesc"), span: "" },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`${f.span} bg-gradient-to-br from-white to-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#00E5A0]/40 hover:shadow-lg transition-all duration-300 group ${featInView ? `animate-fade-up animation-delay-${(i % 3) * 200 || ""}` : "opacity-0"}`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5A0]/20 to-[#00E5A0]/5 text-[#059669] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#0B0F1A] mb-2">{f.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing — Pro card dark ═══ */}
      <section id="pricing" ref={pricingRef} className="px-6 py-24 bg-white text-[#1E293B]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-[#94A3B8] text-center mb-16 max-w-lg mx-auto">
            {t("landing.pricing.subtitle")}
          </p>
          <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 ${pricingInView ? "animate-fade-up" : "opacity-0"}`}>
            {[
              {
                name: t("landing.pricing.trial"),
                price: "0",
                label: t("landing.pricing.trialLabel"),
                orders: t("landing.pricing.trialOrders"),
                users: t("landing.pricing.trialUsers"),
                features: [t("features.scoring"), t("features.dashboard"), t("features.search")],
                cta: t("landing.pricing.trialCta"),
                highlight: false,
              },
              {
                name: "Starter",
                price: "299",
                label: t("landing.pricing.currency"),
                orders: t("landing.pricing.starterOrders"),
                users: t("landing.pricing.starterUsers"),
                features: [t("features.scoring"), t("features.dashboard"), t("features.search"), t("features.csv_export"), t("features.bulk_actions")],
                cta: t("landing.pricing.starterCta"),
                highlight: false,
              },
              {
                name: "Pro",
                price: "699",
                label: t("landing.pricing.currency"),
                orders: t("landing.pricing.proOrders"),
                users: t("landing.pricing.proUsers"),
                features: [
                  t("features.scoring"),
                  t("features.dashboard"),
                  t("features.search"),
                  t("features.csv_export"),
                  t("features.bulk_actions"),
                  t("features.simulation"),
                  t("features.custom_weights"),
                  t("features.pdf_report"),
                ],
                cta: t("landing.pricing.proCta"),
                highlight: true,
              },
              {
                name: "Scale",
                price: "1 499",
                label: t("landing.pricing.currency"),
                orders: t("landing.pricing.scaleOrders"),
                users: t("landing.pricing.scaleUsers"),
                features: [
                  t("landing.pricing.allProPlus"),
                  t("features.multi_users"),
                  t("features.roles"),
                  t("landing.pricing.prioritySupport"),
                ],
                cta: t("landing.pricing.scaleCta"),
                highlight: false,
              },
            ].map((plan, i) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? "bg-gradient-to-b from-[#0B0F1A] to-[#1E293B] text-white relative shadow-[0_0_40px_rgba(0,229,160,0.12)]"
                    : "bg-white border border-[#E2E8F0] hover:shadow-xl"
                } ${pricingInView ? `animate-fade-up animation-delay-${i * 200 || ""}` : "opacity-0"}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00E5A0] text-[#0B0F1A] text-xs font-bold px-4 py-1.5 rounded-full animate-pulse-glow">
                    {t("landing.pricing.popular")}
                  </div>
                )}
                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : "text-[#0B0F1A]"}`}>{plan.name}</h3>
                <div className="mb-4">
                  <span className={`text-3xl font-black ${plan.highlight ? "text-white" : "text-[#0B0F1A]"}`}>{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlight ? "text-white/50" : "text-[#94A3B8]"}`}>{plan.label}</span>
                </div>
                <div className={`text-xs space-y-1 mb-4 ${plan.highlight ? "text-white/60" : "text-[#64748B]"}`}>
                  <p>{plan.orders}</p>
                  <p>{plan.users}</p>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-xs ${plan.highlight ? "text-white/80" : "text-[#475569]"}`}>
                      <Check className="w-3.5 h-3.5 text-[#00E5A0] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`${APP_URL}/register?lang=${locale}`}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] ${
                    plan.highlight
                      ? "bg-[#00E5A0] text-[#0B0F1A] hover:bg-[#00C78A] shadow-lg shadow-[#00E5A0]/20"
                      : "border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC]"
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
      <section id="faq" ref={faqRef} className="px-6 py-24 bg-[#F8FAFC] text-[#1E293B]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-12">
            {t("landing.faq.title")}
          </h2>
          <div className={`space-y-4 ${faqInView ? "animate-fade-up" : "opacity-0"}`}>
            {[
              { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
              { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
              { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
              { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
              { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium text-[#0B0F1A] hover:bg-[#F8FAFC] transition list-none">
                  {item.q}
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] transition-transform duration-300 group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="px-6 pb-4 text-sm text-[#64748B] leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA final — Dark + blob ═══ */}
      <section ref={ctaRef} className="relative px-6 py-24 overflow-hidden bg-[#0B0F1A]">
        {/* Decorative blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E5A0]/10 rounded-full blur-3xl animate-float" />
        <div className={`relative max-w-3xl mx-auto text-center z-10 ${ctaInView ? "animate-fade-up" : "opacity-0"}`}>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-white/50 mb-10">
            {t("landing.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="inline-flex items-center justify-center gap-2 bg-[#00E5A0] text-[#0B0F1A] px-8 py-4 rounded-xl font-bold hover:bg-[#00C78A] hover:scale-105 transition-all duration-200 text-sm animate-pulse-glow"
            >
              {t("landing.cta.button")}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Footer — Dark ═══ */}
      <footer className="border-t border-white/10 px-6 py-12 bg-[#0B0F1A]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/nortoo-logo.png" alt="nortoo" className="h-6 w-auto" />
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                {t("landing.footer.description")}
              </p>
              <p className="text-xs text-[#00E5A0]/40 mt-2 font-medium" dir="rtl">
                &#x0646;&#x0648; &#x0631;.&#x062A;.&#x0648; &mdash; &#x0632;&#x064A;&#x0631;&#x0648; &#x0631;&#x062A;&#x0648;&#x0631;
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{t("landing.footer.product")}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#features" className="hover:text-[#00E5A0] transition">{t("landing.nav.features")}</a></li>
                <li><a href="#pricing" className="hover:text-[#00E5A0] transition">{t("landing.nav.pricing")}</a></li>
                <li><a href="#faq" className="hover:text-[#00E5A0] transition">{t("landing.nav.faq")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{t("landing.footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="/terms" className="hover:text-[#00E5A0] transition">{t("landing.footer.terms")}</a></li>
                <li><a href="/privacy" className="hover:text-[#00E5A0] transition">{t("landing.footer.privacy")}</a></li>
                <li><a href="/data-rights" className="hover:text-[#00E5A0] transition">{t("landing.footer.dataRights")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">{t("landing.footer.contact")}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="mailto:hello@nortoo.ma" className="hover:text-[#00E5A0] transition">hello@nortoo.ma</a></li>
                <li><a href="mailto:support@nortoo.ma" className="hover:text-[#00E5A0] transition">support@nortoo.ma</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} {t("landing.footer.copyright")}
            </p>
            <p className="text-xs text-white/20">
              {t("landing.footer.hosted")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
