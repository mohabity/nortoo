"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const APP_URL = "https://app.nortoo.ma";

interface BlogShellProps {
  children: React.ReactNode;
  serverLocale?: string;
}

export function BlogShell({ children, serverLocale }: BlogShellProps) {
  const { t, locale, setLocale } = useTranslation();
  const router = useRouter();
  const prevLocale = useRef(locale);

  // On mount: if server detected a different locale than client default,
  // force sync to match. This covers the initial page load.
  useEffect(() => {
    if (serverLocale && (serverLocale === "en" || serverLocale === "fr") && locale !== serverLocale) {
      setLocale(serverLocale);
      prevLocale.current = serverLocale;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When locale changes (user clicks FR/EN), refresh server components
  // so they re-read the updated nortoo_lang cookie
  useEffect(() => {
    if (prevLocale.current !== locale) {
      prevLocale.current = locale;
      router.refresh();
    }
  }, [locale, router]);

  return (
    <div className="min-h-screen bg-white text-[#1E293B]">
      {/* ═══ Navbar — exact copy from landing page ═══ */}
      <nav className="border-b border-[#E2E8F0] px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/nortoo-logo.png" alt="nortoo" className="h-7 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#64748B]">
            <a href="/#features" className="hover:text-[#0B0F1A] transition">{t("landing.nav.features")}</a>
            <a href="/#pricing" className="hover:text-[#0B0F1A] transition">{t("landing.nav.pricing")}</a>
            <a href="/blog" className="text-[#0B0F1A] font-medium transition">{t("landing.nav.blog")}</a>
            <a href="/#faq" className="hover:text-[#0B0F1A] transition">{t("landing.nav.faq")}</a>
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
            <a href={`${APP_URL}/login?lang=${locale}`} className="text-sm text-[#64748B] hover:text-[#0B0F1A]">{t("landing.nav.signIn")}</a>
            <a
              href={`${APP_URL}/register?lang=${locale}`}
              className="bg-[#00E5A0] text-[#0B0F1A] px-3 py-1.5 rounded-lg font-semibold text-xs"
            >
              {t("landing.nav.getStarted")}
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>{children}</main>

      {/* ═══ Footer — exact copy from landing page ═══ */}
      <footer className="border-t border-[#E2E8F0] px-6 py-10 mt-20">
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
                <li><a href="/#features" className="hover:text-[#0B0F1A] transition">{t("landing.nav.features")}</a></li>
                <li><a href="/#pricing" className="hover:text-[#0B0F1A] transition">{t("landing.nav.pricing")}</a></li>
                <li><a href="/blog" className="hover:text-[#0B0F1A] transition">{t("landing.nav.blog")}</a></li>
                <li><a href="/#faq" className="hover:text-[#0B0F1A] transition">{t("landing.nav.faq")}</a></li>
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
