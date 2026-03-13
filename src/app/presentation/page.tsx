"use client";

import { useState, useEffect, useRef } from "react";
import {
  Rocket,
  UserPlus,
  ShoppingCart,
  LayoutDashboard,
  Brain,
  ClipboardList,
  BarChart3,
  Code2,
  CreditCard,
  ArrowUp,
  CheckCircle2,
  Mail,
  Lock,
  Store,
  Eye,
  Coins,
  TrendingUp,
  Truck,
  ShieldAlert,
  Search,
  MapPin,
  Phone,
  User,
  Clock,
  Shield,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

const APP_URL = "https://app.nortoo.ma";

/* ── Scroll-triggered animation ── */
function useInView(threshold = 0.1) {
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

/* ════════════════════════════════════════════
   ANNOTATION COMPONENTS
   ════════════════════════════════════════════ */

function Annotation({ number, top, left }: { number: number; top: string; left: string }) {
  return (
    <div
      className="absolute z-20 flex items-center justify-center w-6 h-6 rounded-full bg-mint text-midnight text-xs font-bold shadow-lg ring-2 ring-white"
      style={{ top, left }}
    >
      {number}
    </div>
  );
}

function AnnotatedMockup({
  annotations,
  children,
}: {
  annotations: { number: number; top: string; left: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {annotations.map((a) => (
        <Annotation key={a.number} {...a} />
      ))}
      {children}
    </div>
  );
}

function AnnotationLegend({ items }: { items: { number: number; text: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
      {items.map((item) => (
        <div key={item.number} className="flex items-start gap-2.5">
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-mint/10 text-mint text-[10px] font-bold">
            {item.number}
          </span>
          <span className="text-sm text-fog leading-snug">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   SCREENSHOT FRAME
   ════════════════════════════════════════════ */

function ScreenshotFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-silk shadow-md overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f1f5f9] border-b border-silk">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-mono text-fog flex-1 text-center">{title}</span>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   STEP HEADER
   ════════════════════════════════════════════ */

function StepHeader({
  number,
  title,
  subtitle,
  icon: Icon,
}: {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-mint flex items-center justify-center">
        <span className="text-midnight text-lg font-display font-bold">{number}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-mint flex-shrink-0" />
          <h2 className="font-display text-xl md:text-2xl font-bold text-midnight">{title}</h2>
        </div>
        <p className="text-fog text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   TIP BOX
   ════════════════════════════════════════════ */

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-mint/20 bg-mint/5 p-4 text-sm mt-4">
      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-mint" />
      <div className="text-slate">{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: REGISTER
   ════════════════════════════════════════════ */

function RegisterMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/register">
      <div className="max-w-sm mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-mint flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 18V6l12 12V6" stroke="#0B0F1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <h3 className="text-center font-display text-base font-bold text-midnight mb-4">Créer votre compte</h3>
        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-fog mb-1 block">Nom de la boutique</label>
            <div className="flex items-center gap-2 rounded-lg border border-silk px-3 py-2.5 bg-snow">
              <Store className="h-4 w-4 text-fog" />
              <span className="text-sm text-midnight">Ma Boutique Mode</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-fog mb-1 block">Email professionnel</label>
            <div className="flex items-center gap-2 rounded-lg border border-silk px-3 py-2.5 bg-snow">
              <Mail className="h-4 w-4 text-fog" />
              <span className="text-sm text-midnight">contact@maboutique.ma</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-fog mb-1 block">Mot de passe</label>
            <div className="flex items-center gap-2 rounded-lg border border-silk px-3 py-2.5 bg-snow">
              <Lock className="h-4 w-4 text-fog" />
              <span className="text-sm text-fog">••••••••••</span>
            </div>
          </div>
          <button className="w-full py-2.5 rounded-lg bg-mint text-midnight text-sm font-semibold">
            Créer mon compte
          </button>
          <p className="text-[10px] text-fog text-center">
            En créant un compte, vous acceptez nos CGU et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: ONBOARDING STEPS
   ════════════════════════════════════════════ */

function OnboardingMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/onboarding">
      <div className="mb-4">
        <p className="font-display text-sm font-bold text-midnight mb-3">Étape 2 sur 5 — Connecter votre boutique</p>
        {/* Progress dots */}
        <div className="flex gap-2 mb-5">
          {[true, true, false, false, false].map((done, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", done ? "bg-mint" : "bg-silk")} />
          ))}
        </div>
      </div>

      {/* OAuth card */}
      <div className="rounded-xl border-2 border-mint/30 bg-mint/5 p-5 text-center">
        <div className="w-12 h-12 rounded-xl bg-white border border-silk mx-auto mb-3 flex items-center justify-center">
          <ShoppingCart className="h-6 w-6 text-midnight" />
        </div>
        <h4 className="font-display text-sm font-bold text-midnight mb-1">Connecter YouCan</h4>
        <p className="text-xs text-fog mb-4">Autorisez nortoo à recevoir vos commandes en temps réel via OAuth.</p>
        <button className="px-6 py-2.5 rounded-lg bg-mint text-midnight text-sm font-semibold">
          Autoriser la connexion
        </button>
        <p className="text-[10px] text-fog mt-3 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Connexion sécurisée — nortoo ne modifie jamais vos commandes
        </p>
      </div>

      {/* Steps below */}
      <div className="mt-5 space-y-2">
        {[
          { step: 1, label: "Créer un compte", done: true },
          { step: 2, label: "Connecter YouCan", done: false, active: true },
          { step: 3, label: "Choisir un preset de scoring", done: false },
          { step: 4, label: "Tester le webhook", done: false },
          { step: 5, label: "Voir le dashboard", done: false },
        ].map((s) => (
          <div
            key={s.step}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs",
              s.done ? "bg-mint/5 text-mint" : s.active ? "bg-snow border border-mint/30 text-midnight font-medium" : "text-fog"
            )}
          >
            {s.done ? (
              <CheckCircle2 className="h-4 w-4 text-mint" />
            ) : (
              <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold", s.active ? "border-mint text-mint" : "border-silk text-fog")}>
                {s.step}
              </span>
            )}
            {s.label}
          </div>
        ))}
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: DASHBOARD
   ════════════════════════════════════════════ */

function DashboardMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Économies", value: "12 450 DH", icon: Coins, color: "text-amber-500", change: "+18%" },
          { label: "Score moyen", value: "34.2", icon: TrendingUp, color: "text-mint", change: "-2.1" },
          { label: "Taux livraison", value: "78%", icon: Truck, color: "text-mint", change: "+3%" },
          { label: "Bloquées", value: "23", icon: ShieldAlert, color: "text-violet-500", change: "+5" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-silk p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-fog">{k.label}</span>
              <k.icon className={cn("h-4 w-4", k.color)} />
            </div>
            <p className="font-display text-lg font-bold text-midnight mt-1">{k.value}</p>
            <p className="text-[10px] text-mint font-medium">{k.change}</p>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="rounded-lg border border-silk p-3 mb-4">
        <p className="text-[11px] font-medium text-fog mb-3">Évolution quotidienne</p>
        <svg viewBox="0 0 400 80" className="w-full h-16">
          <defs>
            <linearGradient id="gm-tut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M0 60 Q50 45 100 50 T200 35 T300 40 T400 25" fill="none" stroke="#00E5A0" strokeWidth="2" />
          <path d="M0 60 Q50 45 100 50 T200 35 T300 40 T400 25 V80 H0Z" fill="url(#gm-tut)" />
        </svg>
      </div>
      {/* Orders table */}
      <div className="rounded-lg border border-silk overflow-hidden">
        <div className="px-3 py-2 border-b border-silk bg-[#f8fafc]">
          <span className="text-[11px] font-medium text-fog">Commandes récentes</span>
        </div>
        {[
          { score: 15, decision: "EXPÉDIER", client: "Ahmed B.", city: "Casablanca", amount: "340 DH", dColor: "bg-emerald-100 text-emerald-700", sColor: "bg-emerald-100 text-emerald-700" },
          { score: 48, decision: "VÉRIFIER", client: "Fatima L.", city: "Rabat", amount: "890 DH", dColor: "bg-amber-100 text-amber-700", sColor: "bg-amber-100 text-amber-700" },
          { score: 82, decision: "SIGNALER", client: "Youssef M.", city: "Tanger", amount: "1 200 DH", dColor: "bg-rose-100 text-rose-700", sColor: "bg-rose-100 text-rose-700" },
          { score: 91, decision: "BLOQUER", client: "Test User", city: "Safi", amount: "2 500 DH", dColor: "bg-violet-100 text-violet-700", sColor: "bg-violet-100 text-violet-700" },
        ].map((o) => (
          <div key={o.client} className="flex items-center gap-2 px-3 py-2 border-b border-silk/60 last:border-0 text-xs">
            <span className={cn("font-mono font-bold px-1.5 py-0.5 rounded text-[10px]", o.sColor)}>{o.score}</span>
            <span className="text-midnight font-medium flex-1 truncate">{o.client}</span>
            <span className="text-fog hidden sm:inline">{o.city}</span>
            <span className="font-mono text-midnight font-medium">{o.amount}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", o.dColor)}>{o.decision}</span>
          </div>
        ))}
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: SETTINGS / SCORING
   ════════════════════════════════════════════ */

function SettingsMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard/settings">
      <div className="flex gap-4">
        {/* Tabs */}
        <div className="w-32 shrink-0 space-y-1 hidden sm:block">
          {[
            { label: "Profil", icon: User, active: false },
            { label: "Boutique", icon: Store, active: false },
            { label: "Équipe", icon: Eye, active: false },
            { label: "Scoring", icon: Brain, active: true },
            { label: "Escalade", icon: Clock, active: false },
            { label: "Coûts RTO", icon: Coins, active: false },
            { label: "API", icon: Code2, active: false },
            { label: "Notifications", icon: MessageCircle, active: false },
            { label: "Téléphones", icon: Phone, active: false },
            { label: "Confidentialité", icon: Shield, active: false },
            { label: "Facturation", icon: CreditCard, active: false },
          ].map((t) => (
            <div
              key={t.label}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded text-[10px] font-medium",
                t.active ? "bg-mint/10 text-mint border-l-2 border-mint" : "text-fog"
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </div>
          ))}
        </div>
        {/* Right content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-display font-bold text-midnight mb-3">Seuils de scoring</p>
          <div className="space-y-3 mb-4">
            {[
              { label: "Seuil Vérifier", value: "31", color: "bg-amber-500" },
              { label: "Seuil Signaler", value: "66", color: "bg-rose-500" },
              { label: "Seuil Bloquer", value: "86", color: "bg-violet-500" },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-fog">{s.label}</span>
                  <span className="font-mono font-bold text-midnight">{s.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className={cn("h-full rounded-full", s.color)} style={{ width: `${Number(s.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-display font-bold text-midnight mb-2">Presets rapides</p>
          <div className="flex gap-2 mb-4">
            {["Permissif", "Équilibré", "Conservateur"].map((p) => (
              <span
                key={p}
                className={cn(
                  "text-[10px] px-3 py-1.5 rounded-lg border cursor-pointer",
                  p === "Équilibré"
                    ? "border-mint bg-mint/10 text-mint font-semibold"
                    : "border-silk text-fog hover:border-mint/30"
                )}
              >
                {p}
              </span>
            ))}
          </div>
          {/* Score range preview */}
          <div className="flex rounded-lg overflow-hidden text-[9px] font-semibold text-white h-7">
            <div className="flex items-center justify-center bg-emerald-500" style={{ width: "31%" }}>0-30</div>
            <div className="flex items-center justify-center bg-amber-500" style={{ width: "35%" }}>31-65</div>
            <div className="flex items-center justify-center bg-rose-500" style={{ width: "19%" }}>66-85</div>
            <div className="flex items-center justify-center bg-violet-600" style={{ width: "15%" }}>86-100</div>
          </div>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: ORDERS PAGE
   ════════════════════════════════════════════ */

function OrdersMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard/orders">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[
          { label: "Toutes (147)", active: true, cls: "bg-midnight text-white" },
          { label: "Expédier (89)", active: false, cls: "bg-emerald-500 text-white" },
          { label: "Vérifier (34)", active: false, cls: "bg-amber-500 text-white" },
          { label: "Signaler (16)", active: false, cls: "bg-rose-500 text-white" },
          { label: "Bloquer (8)", active: false, cls: "bg-violet-500 text-white" },
        ].map((p) => (
          <span key={p.label} className={cn("text-[10px] px-2.5 py-1 rounded-full font-medium", p.active ? p.cls : "bg-gray-100 text-fog")}>
            {p.label}
          </span>
        ))}
      </div>
      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-lg border border-silk px-3 py-2 mb-3">
        <Search className="h-3.5 w-3.5 text-fog" />
        <span className="text-xs text-fog">Rechercher par client, ville, n° commande...</span>
      </div>
      {/* Table */}
      <div className="rounded-lg border border-silk overflow-hidden">
        <div className="grid grid-cols-6 gap-1 px-3 py-2 bg-[#f8fafc] border-b border-silk text-[10px] font-medium text-fog">
          <span>Score</span><span>Client</span><span>Date</span><span>Ville</span><span>Montant</span><span>Décision</span>
        </div>
        {[
          { s: 12, c: "Karim A.", d: "13/03", v: "Casablanca", m: "250 DH", dec: "EXPÉDIER", bg: "bg-emerald-100 text-emerald-700", sb: "bg-emerald-100 text-emerald-700" },
          { s: 55, c: "Laila H.", d: "13/03", v: "Fès", m: "720 DH", dec: "VÉRIFIER", bg: "bg-amber-100 text-amber-700", sb: "bg-amber-100 text-amber-700" },
          { s: 71, c: "Omar Z.", d: "12/03", v: "Marrakech", m: "1 500 DH", dec: "SIGNALER", bg: "bg-rose-100 text-rose-700", sb: "bg-rose-100 text-rose-700" },
          { s: 93, c: "Ghost User", d: "12/03", v: "Safi", m: "3 200 DH", dec: "BLOQUER", bg: "bg-violet-100 text-violet-700", sb: "bg-violet-100 text-violet-700" },
        ].map((r) => (
          <div key={r.c} className="grid grid-cols-6 gap-1 px-3 py-2 border-b border-silk/60 text-xs items-center">
            <span className={cn("font-mono font-bold px-1.5 py-0.5 rounded text-[10px] w-fit", r.sb)}>{r.s}</span>
            <span className="text-midnight font-medium truncate">{r.c}</span>
            <span className="text-fog">{r.d}</span>
            <span className="text-fog truncate">{r.v}</span>
            <span className="font-mono text-midnight">{r.m}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold w-fit", r.bg)}>{r.dec}</span>
          </div>
        ))}
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: ORDER DETAIL
   ════════════════════════════════════════════ */

function OrderDetailMockup() {
  return (
    <ScreenshotFrame title="Détail commande — #ORD-2847">
      {/* Score header */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-silk">
        <div className="flex flex-col items-center justify-center h-16 w-16 rounded-xl border-2 border-amber-400 bg-amber-50">
          <span className="font-mono text-xl font-bold text-amber-600">48</span>
          <span className="text-[8px] text-amber-600 font-medium">MOYEN</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-display font-bold text-midnight">#ORD-2847</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">VÉRIFIER</span>
          </div>
          <p className="text-xs text-fog">Fatima Laaroussi · Rabat · 13/03/2026 14:23</p>
          <p className="text-xs font-medium text-midnight">890 DH · 3 articles</p>
        </div>
      </div>
      {/* Scoring factors */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-fog uppercase tracking-wider mb-2">Facteurs de scoring</p>
        <div className="space-y-1.5">
          {[
            { rule: "R0", pts: "+20", label: "Score de base", color: "text-rose-600" },
            { rule: "R2", pts: "-10", label: "Client connu (2 succès)", color: "text-emerald-600" },
            { rule: "R7", pts: "+10", label: "Montant élevé (890 DH)", color: "text-rose-600" },
            { rule: "R8", pts: "+15", label: "Ville à risque modéré (Rabat)", color: "text-rose-600" },
            { rule: "R10c", pts: "-5", label: "Adresse détaillée", color: "text-emerald-600" },
            { rule: "R11", pts: "+8", label: "Commande nocturne (02:23)", color: "text-rose-600" },
            { rule: "R17", pts: "-8", label: "Client régulier", color: "text-emerald-600" },
          ].map((f) => (
            <div key={f.rule} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded bg-[#f8fafc]">
              <span className="font-mono text-[10px] text-mint w-8">{f.rule}</span>
              <span className={cn("font-mono font-bold w-9 text-right", f.color)}>{f.pts}</span>
              <span className="text-fog flex-1">{f.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-silk">
          <span className="text-xs font-semibold text-midnight">Score final</span>
          <span className="font-mono font-bold text-base text-amber-600">48 / 100</span>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex gap-2">
        <div className="flex-1 text-center py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold cursor-pointer hover:bg-emerald-600">
          Forcer l&apos;expédition
        </div>
        <div className="flex-1 text-center py-2 rounded-lg bg-rose-500 text-white text-xs font-semibold cursor-pointer hover:bg-rose-600">
          Forcer le blocage
        </div>
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: ANALYTICS
   ════════════════════════════════════════════ */

function AnalyticsMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard/analytics">
      {/* Period selector */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-display font-bold text-midnight">Tendances RTO</p>
        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {["7j", "30j", "90j"].map((p) => (
            <span key={p} className={cn("text-[10px] px-2.5 py-1 rounded-md font-medium", p === "30j" ? "bg-white shadow-sm text-midnight" : "text-fog")}>
              {p}
            </span>
          ))}
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg border border-mint/20 bg-mint/5 p-3">
          <span className="text-[10px] text-fog">Total économisé</span>
          <p className="font-display text-base font-bold text-midnight">12 450 DH</p>
          <span className="text-[9px] text-mint font-medium">+18% vs mois dernier</span>
        </div>
        <div className="rounded-lg border border-silk p-3">
          <span className="text-[10px] text-fog">Commandes sauvées</span>
          <p className="font-display text-base font-bold text-midnight">23</p>
          <span className="text-[9px] text-fog">sur 147 bloquées</span>
        </div>
        <div className="rounded-lg border border-silk p-3">
          <span className="text-[10px] text-fog">ROI</span>
          <p className="font-display text-base font-bold text-midnight">17.8×</p>
          <span className="text-[9px] text-mint font-medium">+2.3× vs mois dernier</span>
        </div>
      </div>
      {/* Chart */}
      <div className="rounded-lg border border-silk p-3 mb-4">
        <svg viewBox="0 0 400 60" className="w-full h-12">
          <defs>
            <linearGradient id="gd-tut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M0 40 Q50 35 100 42 T200 30 T300 38 T400 25" fill="none" stroke="#00E5A0" strokeWidth="1.5" />
          <path d="M0 50 Q50 48 100 52 T200 45 T300 50 T400 42" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
          <path d="M0 50 Q50 48 100 52 T200 45 T300 50 T400 42 V60 H0Z" fill="url(#gd-tut)" />
        </svg>
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1 text-[9px] text-fog"><span className="h-1.5 w-3 rounded bg-mint" /> Livrées</span>
          <span className="flex items-center gap-1 text-[9px] text-fog"><span className="h-1.5 w-3 rounded bg-rose-400" /> Retours</span>
        </div>
      </div>
      {/* Top risk cities */}
      <p className="text-[10px] font-semibold text-fog uppercase tracking-wider mb-2">Villes les plus risquées</p>
      <div className="rounded-lg border border-silk overflow-hidden">
        {[
          { city: "Safi", orders: 45, rto: "38%", risk: "bg-rose-100 text-rose-700" },
          { city: "Khouribga", orders: 32, rto: "35%", risk: "bg-rose-100 text-rose-700" },
          { city: "Tanger", orders: 89, rto: "28%", risk: "bg-amber-100 text-amber-700" },
        ].map((c) => (
          <div key={c.city} className="flex items-center gap-2 px-3 py-2 border-b border-silk/60 last:border-0 text-xs">
            <MapPin className="h-3.5 w-3.5 text-fog" />
            <span className="font-medium text-midnight flex-1">{c.city}</span>
            <span className="text-fog">{c.orders} cmd</span>
            <span className={cn("font-mono font-bold px-1.5 py-0.5 rounded text-[10px]", c.risk)}>{c.rto}</span>
          </div>
        ))}
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   MOCKUP: WEBHOOK TEST
   ════════════════════════════════════════════ */

function WebhookTestMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard/settings → API">
      <div className="space-y-4">
        {/* API Key */}
        <div>
          <p className="text-xs font-display font-bold text-midnight mb-2">Votre clé API</p>
          <div className="flex items-center gap-2 rounded-lg border border-silk px-3 py-2.5 bg-snow font-mono text-xs">
            <span className="text-midnight">nt_live_</span>
            <span className="text-fog">••••••••••••••••••••</span>
            <button className="ml-auto text-[10px] text-mint font-semibold">Copier</button>
          </div>
        </div>
        {/* Webhook URL */}
        <div>
          <p className="text-xs font-display font-bold text-midnight mb-2">URL Webhook</p>
          <div className="flex items-center gap-2 rounded-lg border border-silk px-3 py-2.5 bg-snow font-mono text-[11px] text-fog overflow-hidden">
            https://api.nortoo.ma/api/webhook/youcan
          </div>
        </div>
        {/* Test result */}
        <div>
          <p className="text-xs font-display font-bold text-midnight mb-2">Test du webhook</p>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Webhook connecté avec succès</span>
            </div>
            <pre className="text-[10px] font-mono text-emerald-800 bg-emerald-100/50 rounded p-2 overflow-x-auto">{`{
  "status": "ok",
  "score": 32,
  "decision": "SHIP",
  "latency_ms": 45
}`}</pre>
          </div>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

/* ════════════════════════════════════════════
   SECTION WRAPPER WITH ANIMATION
   ════════════════════════════════════════════ */

function TutorialStep({ id, children }: { id: string; children: React.ReactNode }) {
  const [ref, inView] = useInView(0.05);
  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "scroll-mt-24 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {children}
    </section>
  );
}

/* ════════════════════════════════════════════
   TOC SIDEBAR
   ════════════════════════════════════════════ */

const SECTIONS = [
  { id: "creer-compte", label: "1. Créer un compte" },
  { id: "connecter-boutique", label: "2. Connecter YouCan" },
  { id: "dashboard", label: "3. Le Dashboard" },
  { id: "scoring", label: "4. Configurer le scoring" },
  { id: "commandes", label: "5. Gérer les commandes" },
  { id: "detail-commande", label: "6. Détail d'une commande" },
  { id: "analytique", label: "7. Analyser les performances" },
  { id: "api", label: "8. API & Webhook" },
];

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════ */
export default function PresentationPage() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Back to top
  useEffect(() => {
    const h = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-snow">
      {/* ── Language Switcher ── */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* ═══ HERO HEADER ═══ */}
      <header className="bg-midnight text-white py-16 md:py-24 px-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-mint/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-[80px]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-mint flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M6 18V6l12 12V6" stroke="#0B0F1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-mint text-xs font-medium mb-6">
            <Clock className="h-3 w-3" />
            ~5 min de lecture
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Guide de démarrage rapide
          </h1>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Configurez nortoo en 5 minutes — de la création de compte à votre première commande scorée.
          </p>

          {/* Quick jump */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-5xl mx-auto px-4 py-12 flex gap-8">
        {/* Desktop TOC sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-[10px] font-semibold text-fog uppercase tracking-wider mb-3 px-3">Sommaire</p>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "block px-3 py-1.5 rounded-lg text-xs transition-colors",
                  activeId === s.id
                    ? "bg-mint/10 text-mint font-semibold border-l-2 border-mint"
                    : "text-fog hover:text-midnight"
                )}
              >
                {s.label}
              </a>
            ))}
            {/* CTA */}
            <div className="mt-6 pt-4 border-t border-silk">
              <a
                href={`${APP_URL}/register`}
                className="block w-full text-center py-2 rounded-lg bg-mint text-midnight text-xs font-semibold hover:bg-mint-dark transition-colors"
              >
                Commencer gratuitement
              </a>
            </div>
          </nav>
        </aside>

        {/* Tutorial content */}
        <div className="min-w-0 flex-1 space-y-16">

          {/* ── ÉTAPE 1: Créer un compte ─────────────────── */}
          <TutorialStep id="creer-compte">
            <StepHeader
              number={1}
              title="Créer votre compte"
              subtitle="Inscription en 30 secondes — aucune carte bancaire requise."
              icon={UserPlus}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "28%", left: "18%" },
              { number: 2, top: "42%", left: "18%" },
              { number: 3, top: "56%", left: "18%" },
              { number: 4, top: "70%", left: "50%" },
            ]}>
              <RegisterMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "Nom de votre boutique — il apparaîtra dans le dashboard et vos rapports." },
              { number: 2, text: "Email professionnel — un lien de vérification vous sera envoyé." },
              { number: 3, text: "Mot de passe sécurisé — minimum 8 caractères." },
              { number: 4, text: "Cliquez pour créer votre compte et accéder à l'onboarding." },
            ]} />

            <Tip>
              Après l&apos;inscription, vérifiez votre email pour activer votre compte. Le lien expire après 24h.
            </Tip>
          </TutorialStep>

          {/* ── ÉTAPE 2: Connecter YouCan ─────────────────── */}
          <TutorialStep id="connecter-boutique">
            <StepHeader
              number={2}
              title="Connecter votre boutique YouCan"
              subtitle="Connexion OAuth sécurisée — nortoo ne modifie jamais vos commandes."
              icon={ShoppingCart}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "8%", left: "85%" },
              { number: 2, top: "30%", left: "50%" },
              { number: 3, top: "62%", left: "85%" },
            ]}>
              <OnboardingMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "Barre de progression — suivez votre avancement dans l'onboarding (5 étapes)." },
              { number: 2, text: "Bouton d'autorisation OAuth — cliquez pour connecter votre boutique YouCan en un clic." },
              { number: 3, text: "Liste des étapes — les étapes complétées sont cochées en vert." },
            ]} />

            <Tip>
              La connexion OAuth est instantanée. nortoo reçoit un accès lecture seule à vos commandes. Vous pouvez révoquer l&apos;accès à tout moment depuis les paramètres.
            </Tip>
          </TutorialStep>

          {/* ── ÉTAPE 3: Dashboard ─────────────────────────── */}
          <TutorialStep id="dashboard">
            <StepHeader
              number={3}
              title="Comprendre le Dashboard"
              subtitle="Vue d'ensemble de vos performances en temps réel."
              icon={LayoutDashboard}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "8%", left: "25%" },
              { number: 2, top: "40%", left: "85%" },
              { number: 3, top: "65%", left: "5%" },
            ]}>
              <DashboardMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "KPIs en temps réel — Économies réalisées, score moyen, taux de livraison et commandes bloquées. Chaque carte montre l'évolution par rapport à la période précédente." },
              { number: 2, text: "Graphique d'évolution — Visualisez la tendance de vos commandes sur les 7, 30 ou 90 derniers jours." },
              { number: 3, text: "Commandes récentes — Les dernières commandes avec leur score, client, ville, montant et décision automatique (Expédier / Vérifier / Signaler / Bloquer)." },
            ]} />

            <Tip>
              Les couleurs des décisions sont cohérentes partout : <strong className="text-emerald-600">vert</strong> = expédier, <strong className="text-amber-600">orange</strong> = vérifier, <strong className="text-rose-600">rose</strong> = signaler, <strong className="text-violet-600">violet</strong> = bloquer.
            </Tip>
          </TutorialStep>

          {/* ── ÉTAPE 4: Scoring ──────────────────────────── */}
          <TutorialStep id="scoring">
            <StepHeader
              number={4}
              title="Configurer le scoring"
              subtitle="Ajustez les seuils de décision selon votre tolérance au risque."
              icon={Brain}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "12%", left: "2%" },
              { number: 2, top: "15%", left: "55%" },
              { number: 3, top: "62%", left: "55%" },
            ]}>
              <SettingsMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "Navigation par onglets — 11 sections de paramétrage : Profil, Boutique, Équipe, Scoring, Escalade, Coûts RTO, API, Notifications, Téléphones, Confidentialité, Facturation." },
              { number: 2, text: "Seuils de scoring — Glissez les curseurs pour définir à quel score une commande passe en Vérifier (31), Signaler (66) ou Bloquer (86). Personnalisable par marchand." },
              { number: 3, text: "Presets rapides — Choisissez entre Permissif (moins de blocages), Équilibré (recommandé), ou Conservateur (protection maximale). Le preset ajuste automatiquement les seuils." },
            ]} />

            <Tip>
              Commencez avec le preset <strong>Équilibré</strong>. Après 2 semaines de données, ajustez les seuils en fonction de vos résultats réels dans l&apos;onglet Analytics.
            </Tip>
          </TutorialStep>

          {/* ── ÉTAPE 5: Commandes ────────────────────────── */}
          <TutorialStep id="commandes">
            <StepHeader
              number={5}
              title="Gérer vos commandes"
              subtitle="Filtrez, recherchez et traitez vos commandes en masse."
              icon={ClipboardList}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "5%", left: "35%" },
              { number: 2, top: "14%", left: "85%" },
              { number: 3, top: "35%", left: "5%" },
            ]}>
              <OrdersMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "Filtres par décision — Cliquez sur un badge pour ne voir que les commandes Expédier, Vérifier, Signaler ou Bloquer. Le compteur entre parenthèses indique le nombre de commandes dans chaque catégorie." },
              { number: 2, text: "Barre de recherche — Trouvez instantanément une commande par nom de client, numéro de commande, ville ou téléphone." },
              { number: 3, text: "Tableau des commandes — Colonnes triables : Score, Client, Date, Ville, Montant, Décision. Cliquez sur une ligne pour voir le détail complet." },
            ]} />

            <Tip>
              Utilisez les <strong>actions en masse</strong> : sélectionnez plusieurs commandes puis forcez l&apos;expédition ou le blocage en un clic. Idéal pour traiter les commandes en attente de vérification.
            </Tip>
          </TutorialStep>

          {/* ── ÉTAPE 6: Détail commande ──────────────────── */}
          <TutorialStep id="detail-commande">
            <StepHeader
              number={6}
              title="Détail d'une commande"
              subtitle="Comprenez le score et prenez une décision manuelle si nécessaire."
              icon={Eye}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "6%", left: "5%" },
              { number: 2, top: "30%", left: "5%" },
              { number: 3, top: "85%", left: "50%" },
            ]}>
              <OrderDetailMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "Score visuel avec badge — Le score est affiché dans un cadre coloré (vert/orange/rose/violet) avec la décision automatique. Vous voyez immédiatement le niveau de risque." },
              { number: 2, text: "Décomposition du score — Chaque règle qui a contribué au score est listée avec ses points (+/-). Les règles positives (risque) sont en rose, les règles négatives (confiance) en vert." },
              { number: 3, text: "Actions manuelles — Forcez l'expédition ou le blocage pour annuler la décision automatique. Chaque override est logué dans l'audit trail." },
            ]} />

            <Tip>
              Quand vous forcez une expédition sur une commande signalée, nortoo apprend de votre décision pour améliorer le scoring futur (auto-ajustement géographique).
            </Tip>
          </TutorialStep>

          {/* ── ÉTAPE 7: Analytics ─────────────────────────── */}
          <TutorialStep id="analytique">
            <StepHeader
              number={7}
              title="Analyser vos performances"
              subtitle="Suivez votre ROI, vos tendances RTO et identifiez les zones à risque."
              icon={BarChart3}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "16%", left: "15%" },
              { number: 2, top: "50%", left: "85%" },
              { number: 3, top: "75%", left: "5%" },
            ]}>
              <AnalyticsMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "KPIs financiers — Total économisé (en DH), commandes sauvées et ROI. Comparez avec le mois précédent pour mesurer votre progression." },
              { number: 2, text: "Graphique de tendance — La courbe verte montre les commandes livrées, la courbe rose en pointillés montre les retours. L'écart entre les deux = vos économies." },
              { number: 3, text: "Villes les plus risquées — Identifiez les zones géographiques avec le taux RTO le plus élevé pour ajuster votre stratégie de livraison." },
            ]} />

            <Tip>
              Exportez vos données en <strong>CSV</strong> (Starter+) ou générez un <strong>rapport PDF mensuel</strong> (Pro+) pour partager avec votre équipe.
            </Tip>
          </TutorialStep>

          {/* ── ÉTAPE 8: API & Webhook ────────────────────── */}
          <TutorialStep id="api">
            <StepHeader
              number={8}
              title="API & Webhook"
              subtitle="Intégration technique pour les développeurs."
              icon={Code2}
            />

            <AnnotatedMockup annotations={[
              { number: 1, top: "8%", left: "85%" },
              { number: 2, top: "35%", left: "85%" },
              { number: 3, top: "60%", left: "5%" },
            ]}>
              <WebhookTestMockup />
            </AnnotatedMockup>

            <AnnotationLegend items={[
              { number: 1, text: "Clé API — Préfixée nt_live_, elle authentifie vos appels à l'API nortoo. Envoyez-la dans le header x-nortoo-key." },
              { number: 2, text: "URL Webhook — Configurez cette URL dans votre boutique YouCan pour recevoir automatiquement chaque commande COD." },
              { number: 3, text: "Test du webhook — Vérifiez que la connexion fonctionne. Le résultat montre le score, la décision et la latence en millisecondes." },
            ]} />

            {/* Code example */}
            <div className="mt-4 rounded-xl bg-midnight p-4 overflow-x-auto">
              <p className="text-[10px] text-fog font-mono mb-2"># Tester votre intégration avec curl</p>
              <pre className="text-xs font-mono text-mint whitespace-pre-wrap">{`curl -X POST https://api.nortoo.ma/api/webhook/ingest \\
  -H "x-nortoo-key: nt_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "test-001",
    "customer": {
      "name": "Test Client",
      "phone": "+212600000000",
      "city": "Casablanca"
    },
    "amount": 450,
    "currency": "MAD"
  }'`}</pre>
            </div>

            <Tip>
              L&apos;API universelle <code className="text-mint bg-mint/10 px-1 rounded">/api/webhook/ingest</code> accepte les commandes de n&apos;importe quelle plateforme, pas seulement YouCan. Authentification par clé API dans le header.
            </Tip>
          </TutorialStep>

          {/* ═══ CTA FINAL ═══ */}
          <div className="rounded-2xl bg-midnight text-white p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-mint/10 rounded-full blur-[120px]" />
            <div className="relative z-10">
              <Rocket className="h-10 w-10 text-mint mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
                Prêt à réduire vos RTO ?
              </h2>
              <p className="text-[#94A3B8] mb-6 max-w-md mx-auto">
                Commencez gratuitement et scorez vos premières commandes en quelques minutes.
              </p>
              <a
                href={`${APP_URL}/register`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-mint text-midnight font-semibold hover:bg-mint-dark transition-colors hover:shadow-[0_0_40px_rgba(0,229,160,0.3)]"
              >
                Commencer gratuitement
                <ChevronRight className="h-4 w-4" />
              </a>
              <p className="text-xs text-[#64748B] mt-4">
                Essai gratuit · Aucune carte requise · 299 DH/mois après essai
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Back to top ── */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-mint text-midnight shadow-lg transition-transform hover:scale-110"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
