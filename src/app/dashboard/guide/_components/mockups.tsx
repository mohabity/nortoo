import {
  Coins,
  TrendingUp,
  Truck,
  ShieldAlert,
  ShoppingCart,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  Phone,
  User,
  MapPin,
  Eye,
  Brain,
  Code2,
  MessageCircle,
  CreditCard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ScreenshotFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-silk shadow-sm overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#f1f5f9] border-b border-silk">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[10px] font-mono text-fog flex-1 text-center">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function DashboardMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {[
          { label: "Économies", value: "12 450 DH", icon: Coins, color: "text-amber-500", change: "+18%" },
          { label: "Score moyen", value: "34.2", icon: TrendingUp, color: "text-mint", change: "-2.1" },
          { label: "Taux livraison", value: "78%", icon: Truck, color: "text-mint", change: "+3%" },
          { label: "Bloquées", value: "23", icon: ShieldAlert, color: "text-violet-500", change: "+5" },
        ].map((k) => (
          <div key={k.label} className="rounded border border-silk p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-fog">{k.label}</span>
              <k.icon className={cn("h-3 w-3", k.color)} />
            </div>
            <p className="font-display text-sm font-bold text-midnight mt-1">{k.value}</p>
            <p className="text-[8px] text-mint font-medium">{k.change}</p>
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="rounded border border-silk p-2.5 mb-3">
        <p className="text-[9px] font-medium text-fog mb-2">Évolution quotidienne</p>
        <svg viewBox="0 0 400 80" className="w-full h-12">
          <defs>
            <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M0 60 Q50 45 100 50 T200 35 T300 40 T400 25" fill="none" stroke="#00E5A0" strokeWidth="2" />
          <path d="M0 60 Q50 45 100 50 T200 35 T300 40 T400 25 V80 H0Z" fill="url(#gm)" />
        </svg>
      </div>
      {/* Orders table preview */}
      <div className="rounded border border-silk overflow-hidden">
        <div className="px-2.5 py-1.5 border-b border-silk bg-[#f8fafc]">
          <span className="text-[9px] font-medium text-fog">Commandes récentes</span>
        </div>
        {[
          { score: 15, decision: "EXPÉDIER", client: "Ahmed B.", city: "Casa", amount: "340 DH", dColor: "bg-emerald-100 text-emerald-700", sColor: "bg-emerald-100 text-emerald-700" },
          { score: 48, decision: "VÉRIFIER", client: "Fatima L.", city: "Rabat", amount: "890 DH", dColor: "bg-amber-100 text-amber-700", sColor: "bg-amber-100 text-amber-700" },
          { score: 82, decision: "SIGNALER", client: "Youssef M.", city: "Tanger", amount: "1 200 DH", dColor: "bg-rose-100 text-rose-700", sColor: "bg-rose-100 text-rose-700" },
          { score: 91, decision: "BLOQUER", client: "Test User", city: "Safi", amount: "2 500 DH", dColor: "bg-violet-100 text-violet-700", sColor: "bg-violet-100 text-violet-700" },
        ].map((o) => (
          <div key={o.client} className="flex items-center gap-2 px-2.5 py-1.5 border-b border-silk/60 last:border-0 text-[9px]">
            <span className={cn("font-mono font-bold px-1 py-0.5 rounded text-[8px]", o.sColor)}>{o.score}</span>
            <span className="text-midnight font-medium flex-1 truncate">{o.client}</span>
            <span className="text-fog hidden sm:inline">{o.city}</span>
            <span className="font-mono text-midnight font-medium">{o.amount}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-semibold", o.dColor)}>{o.decision}</span>
          </div>
        ))}
      </div>
    </ScreenshotFrame>
  );
}

export function OrdersPageMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard/orders">
      {/* Filter pills */}
      <div className="flex gap-1.5 mb-2.5">
        {[
          { label: "Toutes (147)", active: true, cls: "bg-midnight text-white" },
          { label: "Expédier (89)", active: false, cls: "bg-emerald-500 text-white" },
          { label: "Vérifier (34)", active: false, cls: "bg-amber-500 text-white" },
          { label: "Signaler (16)", active: false, cls: "bg-rose-500 text-white" },
          { label: "Bloquer (8)", active: false, cls: "bg-violet-500 text-white" },
        ].map((p) => (
          <span
            key={p.label}
            className={cn(
              "text-[8px] px-2 py-1 rounded-full font-medium",
              p.active ? p.cls : "bg-gray-100 text-fog"
            )}
          >
            {p.label}
          </span>
        ))}
      </div>
      {/* Search bar */}
      <div className="flex items-center gap-1.5 rounded border border-silk px-2 py-1.5 mb-2.5">
        <Search className="h-3 w-3 text-fog" />
        <span className="text-[9px] text-fog">Rechercher par client, ville, n° commande...</span>
      </div>
      {/* Table header */}
      <div className="rounded border border-silk overflow-hidden">
        <div className="grid grid-cols-6 gap-1 px-2 py-1.5 bg-[#f8fafc] border-b border-silk text-[8px] font-medium text-fog">
          <span>Score</span><span>Client</span><span>Date</span><span>Ville</span><span>Montant</span><span>Décision</span>
        </div>
        {[
          { s: 12, c: "Karim A.", d: "01/03", v: "Casablanca", m: "250 DH", dec: "EXPÉDIER", bg: "bg-emerald-100 text-emerald-700", sb: "bg-emerald-100 text-emerald-700" },
          { s: 55, c: "Laila H.", d: "01/03", v: "Fès", m: "720 DH", dec: "VÉRIFIER", bg: "bg-amber-100 text-amber-700", sb: "bg-amber-100 text-amber-700" },
          { s: 71, c: "Omar Z.", d: "28/02", v: "Marrakech", m: "1 500 DH", dec: "SIGNALER", bg: "bg-rose-100 text-rose-700", sb: "bg-rose-100 text-rose-700" },
        ].map((r) => (
          <div key={r.c} className="grid grid-cols-6 gap-1 px-2 py-1.5 border-b border-silk/60 text-[9px] items-center">
            <span className={cn("font-mono font-bold px-1 py-0.5 rounded text-[8px] w-fit", r.sb)}>{r.s}</span>
            <span className="text-midnight font-medium truncate">{r.c}</span>
            <span className="text-fog">{r.d}</span>
            <span className="text-fog truncate">{r.v}</span>
            <span className="font-mono text-midnight">{r.m}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-semibold w-fit", r.bg)}>{r.dec}</span>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between mt-2 text-[8px] text-fog">
        <span>Page 1 sur 15</span>
        <div className="flex gap-1">
          <span className="px-1.5 py-0.5 rounded border border-silk">&larr; Préc</span>
          <span className="px-1.5 py-0.5 rounded border border-silk bg-midnight text-white">Suiv &rarr;</span>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

export function OrderDetailMockup() {
  return (
    <ScreenshotFrame title="Détail commande — #ORD-2847">
      {/* Score header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-silk">
        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg border-2 border-amber-400 bg-amber-50">
          <span className="font-mono text-lg font-bold text-amber-600">48</span>
          <span className="text-[7px] text-amber-600 font-medium">MOYEN</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-display font-bold text-midnight">#ORD-2847</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">VÉRIFIER</span>
          </div>
          <p className="text-[9px] text-fog">Fatima Laaroussi · Rabat · 01/03/2026 14:23</p>
          <p className="text-[9px] font-medium text-midnight">890 DH · 3 articles</p>
        </div>
      </div>
      {/* Factors breakdown */}
      <div className="mb-3">
        <p className="text-[9px] font-semibold text-fog uppercase tracking-wider mb-2">Facteurs de scoring</p>
        <div className="space-y-1">
          {[
            { rule: "R0", pts: "+20", label: "Score de base", color: "text-rose-600" },
            { rule: "R2", pts: "-10", label: "Client connu (2 succès)", color: "text-emerald-600" },
            { rule: "R7", pts: "+10", label: "Montant élevé (890 DH)", color: "text-rose-600" },
            { rule: "R8", pts: "+15", label: "Ville à risque modéré (Rabat)", color: "text-rose-600" },
            { rule: "R10c", pts: "-5", label: "Adresse détaillée", color: "text-emerald-600" },
            { rule: "R11", pts: "+8", label: "Commande nocturne (02:23)", color: "text-rose-600" },
            { rule: "R17", pts: "-8", label: "Client régulier", color: "text-emerald-600" },
          ].map((f) => (
            <div key={f.rule} className="flex items-center gap-2 text-[9px] py-1 px-2 rounded bg-[#f8fafc]">
              <span className="font-mono text-[8px] text-mint w-6">{f.rule}</span>
              <span className={cn("font-mono font-bold w-8 text-right", f.color)}>{f.pts}</span>
              <span className="text-fog flex-1">{f.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-silk">
          <span className="text-[9px] font-semibold text-midnight">Score final</span>
          <span className="font-mono font-bold text-sm text-amber-600">48 / 100</span>
        </div>
      </div>
      {/* Customer info */}
      <div className="mb-3">
        <p className="text-[9px] font-semibold text-fog uppercase tracking-wider mb-2">Informations client</p>
        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-fog" /><span>Fatima Laaroussi</span></div>
          <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-fog" /><span>+212 6** *** **89</span></div>
          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-fog" /><span>Hay Riad, Rabat</span></div>
          <div className="flex items-center gap-1.5"><ShoppingCart className="h-3 w-3 text-fog" /><span>5 commandes passées</span></div>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex gap-2">
        <div className="flex-1 text-center py-1.5 rounded bg-emerald-500 text-white text-[9px] font-semibold">
          Forcer l&apos;expédition
        </div>
        <div className="flex-1 text-center py-1.5 rounded bg-rose-500 text-white text-[9px] font-semibold">
          Forcer le blocage
        </div>
      </div>
    </ScreenshotFrame>
  );
}

export function ScoringFlowDiagram() {
  return (
    <div className="rounded-xl border border-silk bg-[#f8fafc] p-4 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-[600px]">
        {/* Step 1: Order arrives */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-12 w-12 rounded-lg bg-midnight flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <span className="text-[9px] font-medium text-midnight text-center">Commande<br />reçue</span>
        </div>
        <ArrowRight className="h-4 w-4 text-fog shrink-0" />
        {/* Step 2: Base score */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-12 w-20 rounded-lg bg-slate-100 border border-silk flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-midnight">Base: 20</span>
          </div>
          <span className="text-[9px] text-fog text-center">Score<br />initial</span>
        </div>
        <ArrowRight className="h-4 w-4 text-fog shrink-0" />
        {/* Step 3: 8 rule categories */}
        <div className="flex flex-col items-center gap-1">
          <div className="grid grid-cols-4 gap-0.5">
            {[
              { label: "Historique", color: "bg-sky-100 text-sky-700" },
              { label: "Vélocité", color: "bg-purple-100 text-purple-700" },
              { label: "Montant", color: "bg-amber-100 text-amber-700" },
              { label: "Géo", color: "bg-emerald-100 text-emerald-700" },
              { label: "Adresse", color: "bg-orange-100 text-orange-700" },
              { label: "Nom", color: "bg-pink-100 text-pink-700" },
              { label: "Produit", color: "bg-teal-100 text-teal-700" },
              { label: "Heure", color: "bg-indigo-100 text-indigo-700" },
            ].map((c) => (
              <span key={c.label} className={cn("text-[7px] font-medium px-1.5 py-1 rounded text-center", c.color)}>
                {c.label}
              </span>
            ))}
          </div>
          <span className="text-[9px] text-fog text-center">24 règles · 8 catégories</span>
        </div>
        <ArrowRight className="h-4 w-4 text-fog shrink-0" />
        {/* Step 4: Final score */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-12 w-12 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center">
            <span className="font-mono text-sm font-bold text-amber-700">48</span>
          </div>
          <span className="text-[9px] text-fog text-center">Score<br />final</span>
        </div>
        <ArrowRight className="h-4 w-4 text-fog shrink-0" />
        {/* Step 5: Decision */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-0.5">
            <span className="text-[7px] font-semibold px-1.5 py-1 rounded bg-emerald-500 text-white">SHIP</span>
            <span className="text-[7px] font-semibold px-1.5 py-1 rounded bg-amber-500 text-white ring-2 ring-amber-300">VERIFY</span>
            <span className="text-[7px] font-semibold px-1.5 py-1 rounded bg-rose-500 text-white">FLAG</span>
            <span className="text-[7px] font-semibold px-1.5 py-1 rounded bg-violet-600 text-white">BLOCK</span>
          </div>
          <span className="text-[9px] font-medium text-midnight text-center">Décision<br />automatique</span>
        </div>
      </div>
    </div>
  );
}

export function SettingsTabsMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard/settings">
      <div className="flex gap-3">
        {/* Left tabs */}
        <div className="w-28 shrink-0 space-y-0.5">
          {[
            { label: "Profil", icon: User, active: false },
            { label: "Boutique", icon: ShoppingCart, active: false },
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
                "flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-medium",
                t.active
                  ? "bg-mint/10 text-mint border-l-2 border-mint"
                  : "text-fog"
              )}
            >
              <t.icon className="h-2.5 w-2.5" />
              {t.label}
            </div>
          ))}
        </div>
        {/* Right content (Scoring tab) */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-display font-bold text-midnight mb-2">Seuils de scoring</p>
          <div className="space-y-2 mb-3">
            {[
              { label: "Seuil Vérifier", value: "31", color: "bg-amber-500" },
              { label: "Seuil Signaler", value: "66", color: "bg-rose-500" },
              { label: "Seuil Bloquer", value: "86", color: "bg-violet-500" },
            ].map((s) => (
              <div key={s.label} className="space-y-0.5">
                <div className="flex justify-between text-[8px]">
                  <span className="text-fog">{s.label}</span>
                  <span className="font-mono font-bold text-midnight">{s.value}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div className={cn("h-full rounded-full", s.color)} style={{ width: `${Number(s.value)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-display font-bold text-midnight mb-2">Presets</p>
          <div className="flex gap-1.5">
            {["Permissif", "Équilibré", "Conservateur"].map((p) => (
              <span
                key={p}
                className={cn(
                  "text-[8px] px-2 py-1 rounded border",
                  p === "Équilibré"
                    ? "border-mint bg-mint/10 text-mint font-semibold"
                    : "border-silk text-fog"
                )}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ScreenshotFrame>
  );
}

export function OnboardingStepsMockup() {
  return (
    <div className="rounded-xl border border-silk bg-[#f8fafc] p-4">
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        {[
          { step: 1, label: "Créer un compte", desc: "app.nortoo.ma", icon: User, done: true },
          { step: 2, label: "Connecter YouCan", desc: "OAuth automatique", icon: ShoppingCart, done: true },
          { step: 3, label: "Choisir un preset", desc: "Permissif / Équilibré / Conservateur", icon: Brain, done: false },
          { step: 4, label: "Tester le webhook", desc: "Ping de vérification", icon: Code2, done: false },
          { step: 5, label: "Première commande", desc: "Score en temps réel", icon: CheckCircle2, done: false },
        ].map((s) => (
          <div key={s.step} className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center border-2",
              s.done
                ? "bg-mint/10 border-mint text-mint"
                : "bg-white border-silk text-fog"
            )}>
              {s.done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span className="text-[9px] font-semibold text-midnight">{s.step}. {s.label}</span>
            <span className="text-[7px] text-fog">{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsMockup() {
  return (
    <ScreenshotFrame title="app.nortoo.ma/dashboard/analytics">
      {/* Period selector */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-display font-bold text-midnight">Tendances RTO</p>
        <div className="flex gap-0.5 bg-gray-100 rounded p-0.5">
          {["7j", "30j", "90j"].map((p) => (
            <span key={p} className={cn("text-[8px] px-2 py-0.5 rounded font-medium", p === "30j" ? "bg-white shadow-sm text-midnight" : "text-fog")}>
              {p}
            </span>
          ))}
        </div>
      </div>
      {/* Savings KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded border border-mint/20 bg-mint/5 p-2">
          <span className="text-[8px] text-fog">Total économisé</span>
          <p className="font-display text-sm font-bold text-midnight">12 450 DH</p>
          <span className="text-[7px] text-mint font-medium">+18% vs mois dernier</span>
        </div>
        <div className="rounded border border-silk p-2">
          <span className="text-[8px] text-fog">Commandes sauvées</span>
          <p className="font-display text-sm font-bold text-midnight">23</p>
          <span className="text-[7px] text-fog">sur 147 bloquées</span>
        </div>
        <div className="rounded border border-silk p-2">
          <span className="text-[8px] text-fog">ROI</span>
          <p className="font-display text-sm font-bold text-midnight">17.8×</p>
          <span className="text-[7px] text-mint font-medium">+2.3× vs mois dernier</span>
        </div>
      </div>
      {/* Chart */}
      <div className="rounded border border-silk p-2.5 mb-3">
        <svg viewBox="0 0 400 60" className="w-full h-10">
          <defs>
            <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M0 40 Q50 35 100 42 T200 30 T300 38 T400 25" fill="none" stroke="#00E5A0" strokeWidth="1.5" />
          <path d="M0 50 Q50 48 100 52 T200 45 T300 50 T400 42" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
          <path d="M0 50 Q50 48 100 52 T200 45 T300 50 T400 42 V60 H0Z" fill="url(#gd)" />
        </svg>
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1 text-[7px] text-fog"><span className="h-1.5 w-3 rounded bg-mint" /> Livrées</span>
          <span className="flex items-center gap-1 text-[7px] text-fog"><span className="h-1.5 w-3 rounded bg-rose-400" /> Retours</span>
        </div>
      </div>
      {/* Top risk cities */}
      <p className="text-[9px] font-semibold text-fog uppercase tracking-wider mb-1.5">Villes les plus risquées</p>
      <div className="rounded border border-silk overflow-hidden">
        {[
          { city: "Safi", orders: 45, rto: "38%", risk: "bg-rose-100 text-rose-700" },
          { city: "Khouribga", orders: 32, rto: "35%", risk: "bg-rose-100 text-rose-700" },
          { city: "Tanger", orders: 89, rto: "28%", risk: "bg-amber-100 text-amber-700" },
        ].map((c) => (
          <div key={c.city} className="flex items-center gap-2 px-2 py-1.5 border-b border-silk/60 last:border-0 text-[9px]">
            <MapPin className="h-3 w-3 text-fog" />
            <span className="font-medium text-midnight flex-1">{c.city}</span>
            <span className="text-fog">{c.orders} cmd</span>
            <span className={cn("font-mono font-bold px-1.5 py-0.5 rounded text-[8px]", c.risk)}>{c.rto}</span>
          </div>
        ))}
      </div>
    </ScreenshotFrame>
  );
}
