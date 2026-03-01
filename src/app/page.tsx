"use client";

import { useState } from "react";
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
  MessageCircle,
  Smartphone,
} from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const APP_URL = "https://app.nortoo.ma";

/**
 * Landing page — nortoo · COD fraud scoring · Morocco
 * Served on nortoo.ma — all app links point to app.nortoo.ma
 * Bilingual (FR/EN) via useTranslation() · Light theme
 */
export default function Home() {
  const { t, locale } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mockupReply, setMockupReply] = useState<"yes" | "no" | null>(null);
  const [darijaReply, setDarijaReply] = useState<"yes" | "no" | null>(null);

  return (
    <div className="min-h-screen bg-white text-[#1E293B]">
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {/* ═══ Navbar ═══ */}
      <nav className="border-b border-[#E2E8F0] px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/nortoo-logo.png" alt="nortoo" className="h-7 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#64748B]">
            <a href="#features" className="hover:text-[#0B0F1A] transition">{t("landing.nav.features")}</a>
            <a href="#pricing" className="hover:text-[#0B0F1A] transition">{t("landing.nav.pricing")}</a>
            <a href="/blog" className="hover:text-[#0B0F1A] transition">{t("landing.nav.blog")}</a>
            <a href="#faq" className="hover:text-[#0B0F1A] transition">{t("landing.nav.faq")}</a>
            <LanguageSwitcher />
            <a href={`${APP_URL}/login?lang=${locale}`} className="hover:text-[#0B0F1A] transition">{t("landing.nav.signIn")}</a>
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="bg-[#00E5A0] text-[#0B0F1A] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#00C78A] transition"
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
            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="w-5 h-5 text-[#475569]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
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
            mobileMenuOpen ? "max-h-80 border-t border-[#E2E8F0]" : "max-h-0"
          }`}
        >
          <div className="px-6 py-4 space-y-1">
            <a
              href="#features"
              className="block py-2.5 text-sm text-[#64748B] hover:text-[#0B0F1A] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("landing.nav.features")}
            </a>
            <a
              href="#pricing"
              className="block py-2.5 text-sm text-[#64748B] hover:text-[#0B0F1A] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("landing.nav.pricing")}
            </a>
            <a
              href="/blog"
              className="block py-2.5 text-sm text-[#64748B] hover:text-[#0B0F1A] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("landing.nav.blog")}
            </a>
            <a
              href="#faq"
              className="block py-2.5 text-sm text-[#64748B] hover:text-[#0B0F1A] transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("landing.nav.faq")}
            </a>
            <div className="pt-2 border-t border-[#E2E8F0]">
              <a
                href={`${APP_URL}/login?lang=${locale}`}
                className="block py-2.5 text-sm text-[#64748B] hover:text-[#0B0F1A] transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("landing.nav.signIn")}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#00E5A0]/10 text-[#059669] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#00E5A0]/20">
            <Lock className="w-3 h-3" />
            {t("landing.hero.badge")}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black text-[#0B0F1A] leading-tight mb-6">
            {t("landing.hero.titleLine1")}<br />
            <span className="text-[#00C78A]">{t("landing.hero.titleLine2")}</span>
          </h1>
          <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`${APP_URL}/api/auth/youcan?mode=register`}
              className="inline-flex items-center justify-center gap-2 bg-[#5C6AC4] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#4F5BB5] transition text-sm"
            >
              <Plug className="w-4 h-4" />
              {t("landing.hero.ctaYoucan")}
            </a>
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="inline-flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#1E293B] px-6 py-3.5 rounded-xl font-semibold hover:bg-[#F8FAFC] transition text-sm"
            >
              {t("landing.hero.ctaRegister")}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Social proof ═══ */}
      <section className="px-6 py-12 border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#0B0F1A]">24+</p>
            <p className="text-sm text-[#94A3B8] mt-1">{t("landing.stats.rules")}</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#00C78A]">&minus;50%</p>
            <p className="text-sm text-[#94A3B8] mt-1">{t("landing.stats.rto")}</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#0B0F1A]">0-100</p>
            <p className="text-sm text-[#94A3B8] mt-1">{t("landing.stats.score")}</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#00C78A]">WhatsApp</p>
            <p className="text-sm text-[#94A3B8] mt-1">{t("landing.stats.whatsapp")}</p>
          </div>
        </div>
      </section>

      {/* ═══ How it works ═══ */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-4">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="text-[#94A3B8] text-center mb-12 max-w-lg mx-auto">
            {t("landing.howItWorks.subtitle")}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: <Plug className="w-6 h-6" />,
                title: t("landing.howItWorks.step1Title"),
                desc: t("landing.howItWorks.step1Desc"),
              },
              {
                step: "2",
                icon: <Shield className="w-6 h-6" />,
                title: t("landing.howItWorks.step2Title"),
                desc: t("landing.howItWorks.step2Desc"),
              },
              {
                step: "3",
                icon: <TrendingUp className="w-6 h-6" />,
                title: t("landing.howItWorks.step3Title"),
                desc: t("landing.howItWorks.step3Desc"),
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,.04)]">
                <div className="w-10 h-10 rounded-xl bg-[#00E5A0]/10 text-[#059669] flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-xs font-bold text-[#94A3B8]">
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#0B0F1A] mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WhatsApp Verification ═══ */}
      <section className="px-6 py-20 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — text */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#128C7E] text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-[#25D366]/20">
                <MessageCircle className="w-3 h-3" />
                {t("landing.whatsapp.badge")}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] mb-4">
                {t("landing.whatsapp.title")}
              </h2>
              <p className="text-[#64748B] leading-relaxed mb-6">
                {t("landing.whatsapp.subtitle")}
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  t("landing.whatsapp.feature1"),
                  t("landing.whatsapp.feature2"),
                  t("landing.whatsapp.feature3"),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#1E293B]">
                    <div className="w-5 h-5 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#25D366]" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={`${APP_URL}/register?lang=${locale}`}
                className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#0B0F1A] px-6 py-3 rounded-xl font-semibold hover:bg-[#00C78A] transition text-sm"
              >
                {t("landing.cta.button")}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Right — WhatsApp mockups (current lang + Darija) */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-center">
              {/* Mockup — current language */}
              <div className="w-64 rounded-2xl bg-[#ECE5DD] p-3.5 shadow-lg border border-[#D5CEC6]">
                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-[#D5CEC6]">
                  <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111B21]">nortoo</p>
                    <p className="text-[10px] text-[#667781]">Business</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 shadow-sm max-w-[90%]">
                  <p className="text-[11px] text-[#111B21] leading-relaxed">
                    <span className="font-semibold">{t("landing.whatsapp.mockupGreeting")}</span>
                    <br />
                    {t("landing.whatsapp.mockupBody")}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-[#667781]">{t("landing.whatsapp.mockupTime")}</span>
                    <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 15" fill="currentColor">
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51z" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setMockupReply("yes")}
                    className="flex-1 bg-white text-[#00A884] text-xs font-semibold py-1.5 rounded-lg border border-[#D5CEC6] shadow-sm cursor-pointer hover:bg-[#F0FFF4] transition"
                  >
                    {locale === "fr" ? "OUI" : "YES"}
                  </button>
                  <button
                    onClick={() => setMockupReply("no")}
                    className="flex-1 bg-white text-[#E74C3C] text-xs font-semibold py-1.5 rounded-lg border border-[#D5CEC6] shadow-sm cursor-pointer hover:bg-[#FFF5F5] transition"
                  >
                    {locale === "fr" ? "NON" : "NO"}
                  </button>
                </div>
                {mockupReply && (
                  <div className="mt-2 space-y-1.5" style={{ animation: "fadeInUp 0.3s ease-out" }}>
                    <div className="bg-[#DCF8C6] rounded-lg p-2 shadow-sm max-w-[60%] ml-auto">
                      <p className="text-[11px] text-[#111B21] font-medium">
                        {mockupReply === "yes" ? t("landing.whatsapp.mockupReplyYes") : t("landing.whatsapp.mockupReplyNo")}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[10px] text-[#667781]">{t("landing.whatsapp.mockupReplyTime")}</span>
                        <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 15" fill="currentColor">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51z" />
                        </svg>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 shadow-sm max-w-[90%]">
                      <p className="text-[11px] text-[#111B21] leading-relaxed">
                        {mockupReply === "yes" ? t("landing.whatsapp.mockupConfirm") : t("landing.whatsapp.mockupCancel")}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[10px] text-[#667781]">{t("landing.whatsapp.mockupReplyTime")}</span>
                        <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 15" fill="currentColor">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mockup — Darija */}
              <div className="w-64 rounded-2xl bg-[#ECE5DD] p-3.5 shadow-lg border border-[#D5CEC6] sm:mt-8">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#D5CEC6]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#111B21]">nortoo</p>
                      <p className="text-[10px] text-[#667781]">Business</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#128C7E] bg-[#25D366]/10 px-1.5 py-0.5 rounded">
                    {t("landing.whatsapp.darijaLabel")}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 shadow-sm max-w-[90%] ml-auto" dir="rtl">
                  <p className="text-[11px] text-[#111B21] leading-relaxed">
                    <span className="font-semibold">{t("landing.whatsapp.mockupDarijaGreeting")}</span>
                    <br />
                    {t("landing.whatsapp.mockupDarijaBody")}
                  </p>
                  <div className="flex items-center justify-start gap-1 mt-1" dir="ltr">
                    <span className="text-[10px] text-[#667781]">{t("landing.whatsapp.mockupDarijaTime")}</span>
                    <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 15" fill="currentColor">
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51z" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2 mt-2" dir="rtl">
                  <button
                    onClick={() => setDarijaReply("yes")}
                    className="flex-1 bg-white text-[#00A884] text-xs font-semibold py-1.5 rounded-lg border border-[#D5CEC6] shadow-sm cursor-pointer hover:bg-[#F0FFF4] transition"
                  >
                    {t("landing.whatsapp.mockupDarijaYes")}
                  </button>
                  <button
                    onClick={() => setDarijaReply("no")}
                    className="flex-1 bg-white text-[#E74C3C] text-xs font-semibold py-1.5 rounded-lg border border-[#D5CEC6] shadow-sm cursor-pointer hover:bg-[#FFF5F5] transition"
                  >
                    {t("landing.whatsapp.mockupDarijaNo")}
                  </button>
                </div>
                {darijaReply && (
                  <div className="mt-2 space-y-1.5" style={{ animation: "fadeInUp 0.3s ease-out" }}>
                    <div className="bg-[#DCF8C6] rounded-lg p-2 shadow-sm max-w-[60%] mr-auto" dir="rtl">
                      <p className="text-[11px] text-[#111B21] font-medium">
                        {darijaReply === "yes" ? t("landing.whatsapp.mockupDarijaYes") : t("landing.whatsapp.mockupDarijaNo")}
                      </p>
                      <div className="flex items-center justify-start gap-1 mt-0.5" dir="ltr">
                        <span className="text-[10px] text-[#667781]">{t("landing.whatsapp.mockupDarijaTime")}</span>
                        <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 15" fill="currentColor">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51z" />
                        </svg>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 shadow-sm max-w-[90%] ml-auto" dir="rtl">
                      <p className="text-[11px] text-[#111B21] leading-relaxed">
                        {darijaReply === "yes" ? t("landing.whatsapp.mockupDarijaConfirm") : t("landing.whatsapp.mockupDarijaCancel")}
                      </p>
                      <div className="flex items-center justify-start gap-1 mt-0.5" dir="ltr">
                        <span className="text-[10px] text-[#667781]">{t("landing.whatsapp.mockupDarijaTime")}</span>
                        <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 15" fill="currentColor">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.032l6.15-8.079a.365.365 0 0 0-.063-.51z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-[#94A3B8] text-center mb-12 max-w-lg mx-auto">
            {t("landing.features.subtitle")}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Shield className="w-5 h-5" />,
                title: t("landing.features.scoring"),
                desc: t("landing.features.scoringDesc"),
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: t("landing.features.dashboard"),
                desc: t("landing.features.dashboardDesc"),
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: t("landing.features.decisions"),
                desc: t("landing.features.decisionsDesc"),
              },
              {
                icon: <Plug className="w-5 h-5" />,
                title: t("landing.features.integration"),
                desc: t("landing.features.integrationDesc"),
              },
              {
                icon: <Lock className="w-5 h-5" />,
                title: t("landing.features.compliance"),
                desc: t("landing.features.complianceDesc"),
              },
              {
                icon: <FileText className="w-5 h-5" />,
                title: t("landing.features.reports"),
                desc: t("landing.features.reportsDesc"),
              },
              {
                icon: <MessageCircle className="w-5 h-5" />,
                title: t("landing.features.whatsapp"),
                desc: t("landing.features.whatsappDesc"),
              },
              {
                icon: <Smartphone className="w-5 h-5" />,
                title: t("landing.features.embeddedSignup"),
                desc: t("landing.features.embeddedSignupDesc"),
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-5 border border-[#E2E8F0] hover:border-[#00E5A0]/40 transition shadow-[0_1px_4px_rgba(0,0,0,.03)]">
                <div className="w-9 h-9 rounded-lg bg-[#00E5A0]/10 text-[#059669] flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#0B0F1A] mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Pricing ═══ */}
      <section id="pricing" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-[#94A3B8] text-center mb-12 max-w-lg mx-auto">
            {t("landing.pricing.subtitle")}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-[#00E5A0]/5 border-2 border-[#00E5A0]/40 relative"
                    : "bg-white border border-[#E2E8F0]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00E5A0] text-[#0B0F1A] text-xs font-bold px-3 py-1 rounded-full">
                    {t("landing.pricing.popular")}
                  </div>
                )}
                <h3 className="font-bold text-[#0B0F1A] text-lg mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-black text-[#0B0F1A]">{plan.price}</span>
                  <span className="text-sm text-[#94A3B8] ml-1">{plan.label}</span>
                </div>
                <div className="text-xs text-[#64748B] space-y-1 mb-4">
                  <p>{plan.orders}</p>
                  <p>{plan.users}</p>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#475569]">
                      <Check className="w-3.5 h-3.5 text-[#00E5A0] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`${APP_URL}/register?lang=${locale}`}
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-[#00E5A0] text-[#0B0F1A] hover:bg-[#00C78A]"
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
      <section id="faq" className="px-6 py-20 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] text-center mb-12">
            {t("landing.faq.title")}
          </h2>
          <div className="space-y-4">
            {[
              { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
              { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
              { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
              { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
              { q: t("landing.faq.q5"), a: t("landing.faq.a5") },
              { q: t("landing.faq.q6"), a: t("landing.faq.a6") },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium text-[#0B0F1A] hover:bg-[#F8FAFC] transition list-none">
                  {item.q}
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="px-6 pb-4 text-sm text-[#64748B] leading-relaxed">
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
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0F1A] mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-[#64748B] mb-8">
            {t("landing.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="inline-flex items-center justify-center gap-2 bg-[#00E5A0] text-[#0B0F1A] px-6 py-3.5 rounded-xl font-bold hover:bg-[#00C78A] transition text-sm"
            >
              {t("landing.cta.button")}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-[#E2E8F0] px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/nortoo-logo.png" alt="nortoo" className="h-6 w-auto" />
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {t("landing.footer.description")}
              </p>
              <p className="text-xs text-[#94A3B8] mt-2 font-medium" dir="rtl">
                &#x0646;&#x0648; &#x0631;.&#x062A;.&#x0648; &mdash; &#x0632;&#x064A;&#x0631;&#x0648; &#x0631;&#x062A;&#x0648;&#x0631;
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">{t("landing.footer.product")}</h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li><a href="#features" className="hover:text-[#0B0F1A] transition">{t("landing.nav.features")}</a></li>
                <li><a href="#pricing" className="hover:text-[#0B0F1A] transition">{t("landing.nav.pricing")}</a></li>
                <li><a href="/blog" className="hover:text-[#0B0F1A] transition">{t("landing.nav.blog")}</a></li>
                <li><a href="#faq" className="hover:text-[#0B0F1A] transition">{t("landing.nav.faq")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">{t("landing.footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li><a href="/terms" className="hover:text-[#0B0F1A] transition">{t("landing.footer.terms")}</a></li>
                <li><a href="/privacy" className="hover:text-[#0B0F1A] transition">{t("landing.footer.privacy")}</a></li>
                <li><a href="/data-rights" className="hover:text-[#0B0F1A] transition">{t("landing.footer.dataRights")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">{t("landing.footer.contact")}</h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li><a href="mailto:hello@nortoo.ma" className="hover:text-[#0B0F1A] transition">hello@nortoo.ma</a></li>
                <li><a href="mailto:support@nortoo.ma" className="hover:text-[#0B0F1A] transition">support@nortoo.ma</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#E2E8F0] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#94A3B8]">
              &copy; {new Date().getFullYear()} {t("landing.footer.copyright")}
            </p>
            <p className="text-xs text-[#CBD5E1]">
              {t("landing.footer.hosted")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
