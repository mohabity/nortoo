"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Server,
  Brain,
  CheckCircle2,
  XCircle,
  Package,
  TrendingDown,
  DollarSign,
  Users,
  Shield,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  BarChart3,
  ArrowDown,
} from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const APP_URL = "https://app.nortoo.ma";

/* ── Scroll-triggered animation hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ── Animated counter hook ── */
function useCounter(target: number, inView: boolean, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return value;
}

/* ── Score gauge component ── */
function ScoreGauge({ score, inView }: { score: number; inView: boolean }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const animatedScore = useCounter(score, inView, 2000);
  const progress = inView ? (score / 100) * circumference : 0;

  const getColor = (s: number) => {
    if (s <= 30) return "#00E5A0";
    if (s <= 65) return "#F59E0B";
    if (s <= 85) return "#F43F5E";
    return "#DC2626";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="transform -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-[2s] ease-out"
          style={{
            strokeDashoffset: inView
              ? circumference - progress
              : circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-white font-display">
          {animatedScore}
        </span>
        <span className="text-sm text-[#94A3B8] mt-1">/100</span>
      </div>
    </div>
  );
}

/* ── Scoring rule card ── */
function RuleCard({
  icon: Icon,
  name,
  points,
  delay,
  inView,
}: {
  icon: React.ElementType;
  name: string;
  points: string;
  delay: number;
  inView: boolean;
}) {
  const isPositive = points.startsWith("+");
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur
        transition-all duration-500 ${
          inView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#94A3B8]" />
      </div>
      <span className="text-sm text-white/80 flex-1 truncate">{name}</span>
      <span
        className={`text-sm font-mono font-semibold ${
          isPositive ? "text-rose-400" : "text-emerald-400"
        }`}
      >
        {points}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRESENTATION PAGE
   ═══════════════════════════════════════════════════════ */
export default function PresentationPage() {
  const { t } = useTranslation();

  // Scene refs
  const [scene1Ref, scene1InView] = useInView(0.3);
  const [scene2Ref, scene2InView] = useInView();
  const [scene3Ref, scene3InView] = useInView();
  const [scene4Ref, scene4InView] = useInView();
  const [scene5Ref, scene5InView] = useInView();
  const [scene6Ref, scene6InView] = useInView();
  const [scene7Ref, scene7InView] = useInView();
  const [scene8Ref, scene8InView] = useInView(0.3);

  // Animated counters for Scene 2
  const failRate = useCounter(50, scene2InView, 2000);

  // Animated counters for Scene 7
  const stat1 = useCounter(50, scene7InView, 1800);
  const stat2 = useCounter(24, scene7InView, 1500);
  const stat3 = useCounter(100, scene7InView, 2000);

  // Flow steps for Scene 4
  const flowSteps = [
    { icon: ShoppingCart, label: t("pres.flow.order") },
    { icon: Server, label: t("pres.flow.webhook") },
    { icon: Brain, label: t("pres.flow.scoring") },
    { icon: CheckCircle2, label: t("pres.flow.decision") },
  ];

  // Decision badges for Scene 3
  const decisions = [
    { label: "SHIP", range: "0-30", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { label: "VERIFY", range: "31-65", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { label: "FLAG", range: "66-85", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
    { label: "BLOCK", range: "86-100", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  ];

  // Scoring rules for Scene 5
  const rules = [
    { icon: Users, name: t("pres.rules.reliable"), points: "-20" },
    { icon: AlertTriangle, name: t("pres.rules.repeat"), points: "+30" },
    { icon: Users, name: t("pres.rules.new"), points: "+10" },
    { icon: DollarSign, name: t("pres.rules.extreme"), points: "+20" },
    { icon: MapPin, name: t("pres.rules.zone"), points: "+15" },
    { icon: Phone, name: t("pres.rules.phone"), points: "+10" },
    { icon: Clock, name: t("pres.rules.night"), points: "+5" },
    { icon: Shield, name: t("pres.rules.address"), points: "+15" },
  ];

  return (
    <div className="bg-[#0B0F1A] text-white min-h-screen overflow-x-hidden">
      {/* ── Language switcher (fixed) ── */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* ═══ SCENE 1 — Logo Reveal ═══ */}
      <section
        ref={scene1Ref}
        className="min-h-screen flex flex-col items-center justify-center relative px-4"
      >
        {/* Background grid */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        {/* Floating blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00E5A0]/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#8B5CF6]/10 rounded-full blur-[80px] animate-float-reverse" />

        {/* Logo N — SVG draw animation */}
        <div
          className={`relative z-10 transition-all duration-1000 ${
            scene1InView ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        >
          <div className="w-24 h-24 rounded-2xl bg-[#00E5A0] flex items-center justify-center mb-8 mx-auto">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              className="pres-draw-stroke"
            >
              <path
                d="M6 18V6l12 12V6"
                stroke="#0B0F1A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                strokeDashoffset={scene1InView ? "0" : "60"}
                style={{ transition: "stroke-dashoffset 1.5s ease-out 0.3s" }}
              />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <h1
          className={`text-6xl md:text-8xl font-display font-bold tracking-tight relative z-10
            transition-all duration-700 delay-700 ${
              scene1InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
        >
          <span className="animate-gradient-text">nortoo</span>
        </h1>

        {/* Tagline */}
        <p
          className={`text-lg md:text-xl text-[#94A3B8] mt-4 text-center relative z-10
            transition-all duration-700 delay-1000 ${
              scene1InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
        >
          {t("pres.tagline")}
        </p>

        {/* Scroll indicator */}
        <div
          className={`absolute bottom-12 transition-all duration-700 delay-[1.5s] ${
            scene1InView ? "opacity-100" : "opacity-0"
          }`}
        >
          <ArrowDown className="w-6 h-6 text-[#00E5A0]/60 animate-bounce" />
        </div>
      </section>

      {/* ═══ SCENE 2 — Le Problème ═══ */}
      <section
        ref={scene2Ref}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative"
      >
        <div className="max-w-3xl mx-auto text-center">
          {/* Big stat */}
          <div
            className={`transition-all duration-700 ${
              scene2InView
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90"
            }`}
          >
            <div className="inline-flex items-baseline gap-1">
              <span className="text-8xl md:text-[10rem] font-display font-bold text-rose-500">
                {failRate}
              </span>
              <span className="text-4xl md:text-6xl font-display font-bold text-rose-500/70">
                %
              </span>
            </div>
          </div>

          <h2
            className={`text-2xl md:text-4xl font-display font-bold mt-6 transition-all duration-700 delay-300 ${
              scene2InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            {t("pres.problem.title")}
          </h2>

          <p
            className={`text-lg text-[#94A3B8] mt-4 transition-all duration-700 delay-500 ${
              scene2InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {t("pres.problem.subtitle")}
          </p>

          {/* Impact icons */}
          <div
            className={`flex items-center justify-center gap-8 md:gap-16 mt-12 transition-all duration-700 delay-700 ${
              scene2InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            {[
              { icon: Package, label: t("pres.problem.returns") },
              { icon: DollarSign, label: t("pres.problem.losses") },
              { icon: TrendingDown, label: t("pres.problem.margin") },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-rose-400" />
                </div>
                <span className="text-sm text-[#64748B]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SCENE 3 — La Solution ═══ */}
      <section
        ref={scene3Ref}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className={`text-2xl md:text-4xl font-display font-bold mb-12 transition-all duration-700 ${
              scene3InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            {t("pres.solution.title")}
          </h2>

          {/* Score gauge */}
          <div
            className={`mb-12 transition-all duration-700 delay-300 ${
              scene3InView ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <ScoreGauge score={73} inView={scene3InView} />
          </div>

          {/* Decision badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {decisions.map((d, i) => (
              <div
                key={d.label}
                className={`px-4 py-2 rounded-xl border ${d.color} text-sm font-mono font-semibold
                  transition-all duration-500 ${
                    scene3InView
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-4 scale-90"
                  }`}
                style={{ transitionDelay: `${600 + i * 150}ms` }}
              >
                <span className="text-xs opacity-60 mr-2">{d.range}</span>
                {d.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SCENE 4 — Comment ça marche ═══ */}
      <section
        ref={scene4Ref}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative"
      >
        <h2
          className={`text-2xl md:text-4xl font-display font-bold mb-16 text-center transition-all duration-700 ${
            scene4InView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          {t("pres.howItWorks.title")}
        </h2>

        {/* Flow */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4 max-w-4xl mx-auto">
          {flowSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              {/* Step */}
              <div
                className={`flex flex-col items-center gap-3 transition-all duration-600 ${
                  scene4InView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${300 + i * 250}ms` }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <step.icon className="w-7 h-7 md:w-8 md:h-8 text-[#00E5A0]" />
                </div>
                <span className="text-sm text-[#94A3B8] text-center whitespace-nowrap">
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < flowSteps.length - 1 && (
                <div
                  className={`hidden md:block w-16 lg:w-24 h-px bg-gradient-to-r from-[#00E5A0]/40 to-[#00E5A0]/10
                    transition-all duration-700 origin-left ${
                      scene4InView ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                    }`}
                  style={{ transitionDelay: `${500 + i * 250}ms` }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Subtitle */}
        <p
          className={`text-[#64748B] text-center mt-12 max-w-lg transition-all duration-700 delay-[1.5s] ${
            scene4InView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {t("pres.howItWorks.subtitle")}
        </p>
      </section>

      {/* ═══ SCENE 5 — Le Moteur de Scoring ═══ */}
      <section
        ref={scene5Ref}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative"
      >
        <h2
          className={`text-2xl md:text-4xl font-display font-bold mb-4 text-center transition-all duration-700 ${
            scene5InView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          {t("pres.scoring.title")}
        </h2>
        <p
          className={`text-[#64748B] mb-12 text-center transition-all duration-700 delay-200 ${
            scene5InView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {t("pres.scoring.subtitle")}
        </p>

        {/* Rules grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mx-auto">
          {rules.map((rule, i) => (
            <RuleCard
              key={i}
              icon={rule.icon}
              name={rule.name}
              points={rule.points}
              delay={300 + i * 100}
              inView={scene5InView}
            />
          ))}
        </div>
      </section>

      {/* ═══ SCENE 6 — Dashboard Preview ═══ */}
      <section
        ref={scene6Ref}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative"
      >
        <h2
          className={`text-2xl md:text-4xl font-display font-bold mb-12 text-center transition-all duration-700 ${
            scene6InView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6"
          }`}
        >
          {t("pres.dashboard.title")}
        </h2>

        {/* Mock dashboard */}
        <div
          className={`w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur p-6 md:p-8
            transition-all duration-700 delay-300 ${
              scene6InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
        >
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: t("pres.dashboard.orders"), value: "1,247", color: "text-white" },
              { label: t("pres.dashboard.shipped"), value: "842", color: "text-emerald-400" },
              { label: t("pres.dashboard.blocked"), value: "189", color: "text-rose-400" },
              { label: t("pres.dashboard.rtoRate"), value: "12%", color: "text-amber-400" },
            ].map((kpi, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl bg-white/[0.04] border border-white/5 transition-all duration-500 ${
                  scene6InView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${500 + i * 100}ms` }}
              >
                <p className="text-xs text-[#64748B] mb-1">{kpi.label}</p>
                <p className={`text-2xl font-display font-bold ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Mock chart */}
          <div
            className={`h-32 md:h-40 rounded-xl bg-white/[0.03] border border-white/5 mb-8 flex items-end px-4 pb-4 gap-2 md:gap-3
              transition-all duration-700 ${
                scene6InView
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            style={{ transitionDelay: "900ms" }}
          >
            {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-[#00E5A0]/30 transition-all duration-700"
                style={{
                  height: scene6InView ? `${h}%` : "0%",
                  transitionDelay: `${1000 + i * 80}ms`,
                }}
              />
            ))}
          </div>

          {/* Mock table */}
          <div
            className={`space-y-2 transition-all duration-700 ${
              scene6InView ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "1200ms" }}
          >
            {[
              { id: "#1247", score: 18, decision: "SHIP", color: "text-emerald-400" },
              { id: "#1246", score: 52, decision: "VERIFY", color: "text-amber-400" },
              { id: "#1245", score: 78, decision: "FLAG", color: "text-rose-400" },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <span className="text-sm font-mono text-[#64748B]">{row.id}</span>
                <span className="flex-1" />
                <span className="text-sm font-mono text-white/60">
                  {row.score}/100
                </span>
                <span className={`text-xs font-mono font-semibold ${row.color}`}>
                  {row.decision}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SCENE 7 — Chiffres Clés ═══ */}
      <section
        ref={scene7Ref}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 max-w-4xl mx-auto">
          {[
            {
              value: stat1,
              suffix: "%",
              label: t("pres.stats.rtoReduction"),
              color: "text-emerald-400",
              delay: 0,
            },
            {
              value: stat2,
              suffix: "",
              label: t("pres.stats.rules"),
              color: "text-[#00E5A0]",
              delay: 200,
            },
            {
              value: stat3,
              suffix: "",
              prefix: "0-",
              label: t("pres.stats.realtime"),
              color: "text-violet-400",
              delay: 400,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`text-center transition-all duration-700 ${
                scene7InView
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-75"
              }`}
              style={{ transitionDelay: `${stat.delay}ms` }}
            >
              <div className={`text-6xl md:text-8xl font-display font-bold ${stat.color}`}>
                {stat.prefix || ""}
                {stat.value}
                {stat.suffix}
              </div>
              <p className="text-lg text-[#94A3B8] mt-3">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SCENE 8 — CTA Final ═══ */}
      <section
        ref={scene8Ref}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative"
      >
        {/* Gradient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00E5A0]/5 rounded-full blur-[120px]" />

        <h2
          className={`text-3xl md:text-5xl font-display font-bold text-center mb-6 relative z-10
            transition-all duration-700 ${
              scene8InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
        >
          {t("pres.cta.title")}
        </h2>

        <p
          className={`text-lg text-[#94A3B8] text-center mb-10 max-w-md relative z-10
            transition-all duration-700 delay-300 ${
              scene8InView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
        >
          {t("pres.cta.subtitle")}
        </p>

        <a
          href={`${APP_URL}/register`}
          className={`relative z-10 inline-flex items-center gap-2 px-8 py-4 rounded-2xl
            bg-[#00E5A0] text-[#0B0F1A] font-semibold text-lg
            hover:bg-[#00C78A] transition-all duration-300
            hover:shadow-[0_0_40px_rgba(0,229,160,0.3)]
            ${
              scene8InView
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95"
            }`}
          style={{ transitionDelay: "500ms", transitionDuration: "700ms" }}
        >
          {t("pres.cta.button")}
        </a>

        {/* Footer note */}
        <p
          className={`text-sm text-[#64748B] mt-8 relative z-10 transition-all duration-700 delay-700 ${
            scene8InView ? "opacity-100" : "opacity-0"
          }`}
        >
          {t("pres.cta.trial")}
        </p>
      </section>
    </div>
  );
}
