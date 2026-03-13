"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Server,
  Brain,
  CheckCircle2,
  Package,
  TrendingDown,
  DollarSign,
  Users,
  Shield,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
} from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const APP_URL = "https://app.nortoo.ma";
const TOTAL_DURATION = 75; // seconds

/* ── Scene timing definitions ── */
const SCENES = [
  { id: 0, start: 0, end: 8 },    // Logo Reveal
  { id: 1, start: 8, end: 18 },   // Le Problème
  { id: 2, start: 18, end: 30 },  // La Solution
  { id: 3, start: 30, end: 40 },  // Flow
  { id: 4, start: 40, end: 50 },  // Scoring Engine
  { id: 5, start: 50, end: 60 },  // Dashboard
  { id: 6, start: 60, end: 68 },  // Stats
  { id: 7, start: 68, end: 75 },  // CTA
];

/* ── Utility: clamp ── */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/* ── Utility: eased progress for an element within a scene ── */
function elementProgress(
  elapsed: number,
  sceneStart: number,
  delay: number,
  duration: number
) {
  const local = elapsed - sceneStart - delay;
  const raw = clamp(local / duration, 0, 1);
  // ease-out cubic
  return 1 - Math.pow(1 - raw, 3);
}

/* ── Utility: counter value (eased) ── */
function counterValue(progress: number, target: number) {
  return Math.round(target * progress);
}

/* ── Utility: format time mm:ss ── */
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Timeline hook ── */
function useTimeline(totalDuration: number) {
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const tick = useCallback(
    (now: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
      }
      const delta = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      setElapsed((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) return totalDuration;
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    },
    [totalDuration]
  );

  useEffect(() => {
    if (isPlaying && elapsed < totalDuration) {
      lastFrameRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, tick, elapsed, totalDuration]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      if (!p && elapsed >= totalDuration) {
        setElapsed(0);
      }
      return !p;
    });
  }, [elapsed, totalDuration]);
  const seek = useCallback(
    (t: number) => {
      setElapsed(clamp(t, 0, totalDuration));
      lastFrameRef.current = null;
    },
    [totalDuration]
  );
  const replay = useCallback(() => {
    setElapsed(0);
    lastFrameRef.current = null;
    setIsPlaying(true);
  }, []);

  const progress = elapsed / totalDuration;
  const currentScene = SCENES.findIndex(
    (s) => elapsed >= s.start && elapsed < s.end
  );

  return {
    elapsed,
    progress,
    isPlaying,
    currentScene: currentScene === -1 ? SCENES.length - 1 : currentScene,
    play,
    pause,
    togglePlay,
    seek,
    replay,
  };
}

/* ── Score Gauge (timeline-driven) ── */
function ScoreGauge({ progress }: { progress: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const score = Math.round(73 * progress);
  const strokeProgress = (73 / 100) * circumference * progress;

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
          strokeDashoffset={circumference - strokeProgress}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-white font-display">
          {score}
        </span>
        <span className="text-sm text-[#94A3B8] mt-1">/100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRESENTATION PAGE — Video-style timeline animation
   ═══════════════════════════════════════════════════════ */
export default function PresentationPage() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const {
    elapsed,
    progress,
    isPlaying,
    currentScene,
    togglePlay,
    seek,
    replay,
  } = useTimeline(TOTAL_DURATION);

  // Auto-hide controls after 3s
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, showControls]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Progress bar click → seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressBarRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    seek(ratio * TOTAL_DURATION);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowRight") seek(Math.min(elapsed + 5, TOTAL_DURATION));
      if (e.key === "ArrowLeft") seek(Math.max(elapsed - 5, 0));
      if (e.key === "f") toggleFullscreen();
      if (e.key === "r") replay();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [elapsed, togglePlay, seek, toggleFullscreen, replay]);

  // Scene visibility helper
  const sceneOpacity = (sceneIdx: number) => {
    const scene = SCENES[sceneIdx];
    const fadeIn = 0.8;
    const fadeOut = 0.8;

    if (elapsed < scene.start) return 0;
    if (elapsed > scene.end) return 0;

    // Fade in
    if (elapsed < scene.start + fadeIn) {
      return (elapsed - scene.start) / fadeIn;
    }
    // Fade out
    if (elapsed > scene.end - fadeOut) {
      return (scene.end - elapsed) / fadeOut;
    }
    return 1;
  };

  // Element animation helper
  const ep = (sceneIdx: number, delay: number, duration = 0.8) =>
    elementProgress(elapsed, SCENES[sceneIdx].start, delay, duration);

  // Flow steps
  const flowSteps = [
    { icon: ShoppingCart, label: t("pres.flow.order") },
    { icon: Server, label: t("pres.flow.webhook") },
    { icon: Brain, label: t("pres.flow.scoring") },
    { icon: CheckCircle2, label: t("pres.flow.decision") },
  ];

  // Decision badges
  const decisions = [
    { label: "SHIP", range: "0-30", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { label: "VERIFY", range: "31-65", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { label: "FLAG", range: "66-85", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
    { label: "BLOCK", range: "86-100", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  ];

  // Scoring rules
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
    <div
      ref={containerRef}
      className="bg-[#0B0F1A] text-white w-screen h-screen overflow-hidden relative select-none"
      onMouseMove={showControls}
      onTouchStart={showControls}
      onClick={(e) => {
        // Click on video area (not controls) → toggle play
        if ((e.target as HTMLElement).closest("[data-controls]")) return;
        togglePlay();
      }}
    >
      {/* ── Language switcher ── */}
      <div
        className={`fixed top-6 right-6 z-50 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        data-controls
      >
        <LanguageSwitcher />
      </div>

      {/* ── Scene container (all scenes stacked absolutely) ── */}
      <div className="absolute inset-0">
        {/* Background elements (always visible) */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00E5A0]/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#8B5CF6]/10 rounded-full blur-[80px] animate-float-reverse" />

        {/* ═══ SCENE 0 — Logo Reveal (0-8s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
          style={{
            opacity: sceneOpacity(0),
            pointerEvents: currentScene === 0 ? "auto" : "none",
          }}
        >
          {/* Logo N */}
          <div
            style={{
              opacity: ep(0, 0, 1),
              transform: `scale(${0.75 + 0.25 * ep(0, 0, 1)})`,
            }}
          >
            <div className="w-24 h-24 rounded-2xl bg-[#00E5A0] flex items-center justify-center mb-8 mx-auto">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 18V6l12 12V6"
                  stroke="#0B0F1A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="60"
                  strokeDashoffset={60 - 60 * ep(0, 0.3, 1.5)}
                />
              </svg>
            </div>
          </div>

          {/* Brand name */}
          <h1
            className="text-6xl md:text-8xl font-display font-bold tracking-tight"
            style={{
              opacity: ep(0, 1.5, 1),
              transform: `translateY(${(1 - ep(0, 1.5, 1)) * 24}px)`,
            }}
          >
            <span className="animate-gradient-text">nortoo</span>
          </h1>

          {/* Tagline */}
          <p
            className="text-lg md:text-xl text-[#94A3B8] mt-4 text-center"
            style={{
              opacity: ep(0, 2.5, 1),
              transform: `translateY(${(1 - ep(0, 2.5, 1)) * 16}px)`,
            }}
          >
            {t("pres.tagline")}
          </p>
        </div>

        {/* ═══ SCENE 1 — Le Problème (8-18s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
          style={{
            opacity: sceneOpacity(1),
            pointerEvents: currentScene === 1 ? "auto" : "none",
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            {/* Big stat */}
            <div
              style={{
                opacity: ep(1, 0, 1.2),
                transform: `scale(${0.9 + 0.1 * ep(1, 0, 1.2)})`,
              }}
            >
              <div className="inline-flex items-baseline gap-1">
                <span className="text-8xl md:text-[10rem] font-display font-bold text-rose-500">
                  {counterValue(ep(1, 0, 2), 50)}
                </span>
                <span className="text-4xl md:text-6xl font-display font-bold text-rose-500/70">
                  %
                </span>
              </div>
            </div>

            <h2
              className="text-2xl md:text-4xl font-display font-bold mt-6"
              style={{
                opacity: ep(1, 1, 0.8),
                transform: `translateY(${(1 - ep(1, 1, 0.8)) * 24}px)`,
              }}
            >
              {t("pres.problem.title")}
            </h2>

            <p
              className="text-lg text-[#94A3B8] mt-4"
              style={{
                opacity: ep(1, 1.8, 0.8),
                transform: `translateY(${(1 - ep(1, 1.8, 0.8)) * 16}px)`,
              }}
            >
              {t("pres.problem.subtitle")}
            </p>

            {/* Impact icons */}
            <div className="flex items-center justify-center gap-8 md:gap-16 mt-12">
              {[
                { icon: Package, label: t("pres.problem.returns") },
                { icon: DollarSign, label: t("pres.problem.losses") },
                { icon: TrendingDown, label: t("pres.problem.margin") },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2"
                  style={{
                    opacity: ep(1, 2.5 + i * 0.3, 0.6),
                    transform: `translateY(${(1 - ep(1, 2.5 + i * 0.3, 0.6)) * 20}px)`,
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-rose-400" />
                  </div>
                  <span className="text-sm text-[#64748B]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ SCENE 2 — La Solution (18-30s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
          style={{
            opacity: sceneOpacity(2),
            pointerEvents: currentScene === 2 ? "auto" : "none",
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-2xl md:text-4xl font-display font-bold mb-12"
              style={{
                opacity: ep(2, 0, 0.8),
                transform: `translateY(${(1 - ep(2, 0, 0.8)) * 24}px)`,
              }}
            >
              {t("pres.solution.title")}
            </h2>

            {/* Score gauge */}
            <div
              style={{
                opacity: ep(2, 0.5, 0.8),
                transform: `scale(${0.75 + 0.25 * ep(2, 0.5, 0.8)})`,
              }}
            >
              <ScoreGauge progress={ep(2, 1, 3)} />
            </div>

            {/* Decision badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-12">
              {decisions.map((d, i) => (
                <div
                  key={d.label}
                  className={`px-4 py-2 rounded-xl border ${d.color} text-sm font-mono font-semibold`}
                  style={{
                    opacity: ep(2, 4 + i * 0.5, 0.6),
                    transform: `translateY(${(1 - ep(2, 4 + i * 0.5, 0.6)) * 16}px) scale(${0.9 + 0.1 * ep(2, 4 + i * 0.5, 0.6)})`,
                  }}
                >
                  <span className="text-xs opacity-60 mr-2">{d.range}</span>
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ SCENE 3 — Comment ça marche (30-40s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
          style={{
            opacity: sceneOpacity(3),
            pointerEvents: currentScene === 3 ? "auto" : "none",
          }}
        >
          <h2
            className="text-2xl md:text-4xl font-display font-bold mb-16 text-center"
            style={{
              opacity: ep(3, 0, 0.8),
              transform: `translateY(${(1 - ep(3, 0, 0.8)) * 24}px)`,
            }}
          >
            {t("pres.howItWorks.title")}
          </h2>

          {/* Flow */}
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4 max-w-4xl mx-auto">
            {flowSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="flex flex-col items-center gap-3"
                  style={{
                    opacity: ep(3, 0.8 + i * 0.8, 0.7),
                    transform: `translateY(${(1 - ep(3, 0.8 + i * 0.8, 0.7)) * 30}px)`,
                  }}
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
                    className="hidden md:block w-16 lg:w-24 h-px bg-gradient-to-r from-[#00E5A0]/40 to-[#00E5A0]/10 origin-left"
                    style={{
                      transform: `scaleX(${ep(3, 1.2 + i * 0.8, 0.6)})`,
                      opacity: ep(3, 1.2 + i * 0.8, 0.6),
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <p
            className="text-[#64748B] text-center mt-12 max-w-lg"
            style={{
              opacity: ep(3, 4, 0.8),
              transform: `translateY(${(1 - ep(3, 4, 0.8)) * 16}px)`,
            }}
          >
            {t("pres.howItWorks.subtitle")}
          </p>
        </div>

        {/* ═══ SCENE 4 — Scoring Engine (40-50s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
          style={{
            opacity: sceneOpacity(4),
            pointerEvents: currentScene === 4 ? "auto" : "none",
          }}
        >
          <h2
            className="text-2xl md:text-4xl font-display font-bold mb-4 text-center"
            style={{
              opacity: ep(4, 0, 0.8),
              transform: `translateY(${(1 - ep(4, 0, 0.8)) * 24}px)`,
            }}
          >
            {t("pres.scoring.title")}
          </h2>
          <p
            className="text-[#64748B] mb-12 text-center"
            style={{
              opacity: ep(4, 0.4, 0.6),
              transform: `translateY(${(1 - ep(4, 0.4, 0.6)) * 16}px)`,
            }}
          >
            {t("pres.scoring.subtitle")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full mx-auto">
            {rules.map((rule, i) => {
              const p = ep(4, 1 + i * 0.3, 0.5);
              const isPositive = rule.points.startsWith("+");
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur"
                  style={{
                    opacity: p,
                    transform: `translateY(${(1 - p) * 16}px)`,
                  }}
                >
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                    <rule.icon className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                  <span className="text-sm text-white/80 flex-1 truncate">
                    {rule.name}
                  </span>
                  <span
                    className={`text-sm font-mono font-semibold ${
                      isPositive ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {rule.points}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ SCENE 5 — Dashboard Preview (50-60s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4 py-20"
          style={{
            opacity: sceneOpacity(5),
            pointerEvents: currentScene === 5 ? "auto" : "none",
          }}
        >
          <h2
            className="text-2xl md:text-4xl font-display font-bold mb-12 text-center"
            style={{
              opacity: ep(5, 0, 0.8),
              transform: `translateY(${(1 - ep(5, 0, 0.8)) * 24}px)`,
            }}
          >
            {t("pres.dashboard.title")}
          </h2>

          <div
            className="w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur p-6 md:p-8"
            style={{
              opacity: ep(5, 0.5, 0.8),
              transform: `translateY(${(1 - ep(5, 0.5, 0.8)) * 30}px)`,
            }}
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
                  className="p-4 rounded-xl bg-white/[0.04] border border-white/5"
                  style={{
                    opacity: ep(5, 1.2 + i * 0.3, 0.5),
                    transform: `translateY(${(1 - ep(5, 1.2 + i * 0.3, 0.5)) * 16}px)`,
                  }}
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
              className="h-32 md:h-40 rounded-xl bg-white/[0.03] border border-white/5 mb-8 flex items-end px-4 pb-4 gap-2 md:gap-3"
              style={{ opacity: ep(5, 3, 0.6) }}
            >
              {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-[#00E5A0]/30"
                  style={{
                    height: `${h * ep(5, 3.2 + i * 0.15, 0.6)}%`,
                  }}
                />
              ))}
            </div>

            {/* Mock table */}
            <div style={{ opacity: ep(5, 5, 0.8) }}>
              {[
                { id: "#1247", score: 18, decision: "SHIP", color: "text-emerald-400" },
                { id: "#1246", score: 52, decision: "VERIFY", color: "text-amber-400" },
                { id: "#1245", score: 78, decision: "FLAG", color: "text-rose-400" },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 mb-2"
                  style={{
                    opacity: ep(5, 5.5 + i * 0.3, 0.5),
                    transform: `translateX(${(1 - ep(5, 5.5 + i * 0.3, 0.5)) * -20}px)`,
                  }}
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
        </div>

        {/* ═══ SCENE 6 — Chiffres Clés (60-68s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
          style={{
            opacity: sceneOpacity(6),
            pointerEvents: currentScene === 6 ? "auto" : "none",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 max-w-4xl mx-auto">
            {[
              {
                target: 50,
                suffix: "%",
                prefix: "",
                label: t("pres.stats.rtoReduction"),
                color: "text-emerald-400",
                delay: 0,
              },
              {
                target: 24,
                suffix: "",
                prefix: "",
                label: t("pres.stats.rules"),
                color: "text-[#00E5A0]",
                delay: 0.5,
              },
              {
                target: 100,
                suffix: "",
                prefix: "0-",
                label: t("pres.stats.realtime"),
                color: "text-violet-400",
                delay: 1,
              },
            ].map((stat, i) => {
              const p = ep(6, stat.delay, 1);
              return (
                <div
                  key={i}
                  className="text-center"
                  style={{
                    opacity: p,
                    transform: `scale(${0.75 + 0.25 * p})`,
                  }}
                >
                  <div
                    className={`text-6xl md:text-8xl font-display font-bold ${stat.color}`}
                  >
                    {stat.prefix}
                    {counterValue(ep(6, stat.delay, 2), stat.target)}
                    {stat.suffix}
                  </div>
                  <p className="text-lg text-[#94A3B8] mt-3">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ SCENE 7 — CTA Final (68-75s) ═══ */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
          style={{
            opacity: sceneOpacity(7),
            pointerEvents: currentScene === 7 ? "auto" : "none",
          }}
        >
          {/* Gradient glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00E5A0]/5 rounded-full blur-[120px]" />

          <h2
            className="text-3xl md:text-5xl font-display font-bold text-center mb-6 relative z-10"
            style={{
              opacity: ep(7, 0, 1),
              transform: `translateY(${(1 - ep(7, 0, 1)) * 30}px)`,
            }}
          >
            {t("pres.cta.title")}
          </h2>

          <p
            className="text-lg text-[#94A3B8] text-center mb-10 max-w-md relative z-10"
            style={{
              opacity: ep(7, 0.8, 0.8),
              transform: `translateY(${(1 - ep(7, 0.8, 0.8)) * 16}px)`,
            }}
          >
            {t("pres.cta.subtitle")}
          </p>

          <a
            href={`${APP_URL}/register`}
            className="relative z-10 inline-flex items-center gap-2 px-8 py-4 rounded-2xl
              bg-[#00E5A0] text-[#0B0F1A] font-semibold text-lg
              hover:bg-[#00C78A] transition-colors duration-300
              hover:shadow-[0_0_40px_rgba(0,229,160,0.3)]"
            style={{
              opacity: ep(7, 1.5, 0.8),
              transform: `translateY(${(1 - ep(7, 1.5, 0.8)) * 16}px) scale(${0.95 + 0.05 * ep(7, 1.5, 0.8)})`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {t("pres.cta.button")}
          </a>

          <p
            className="text-sm text-[#64748B] mt-8 relative z-10"
            style={{ opacity: ep(7, 2.5, 0.8) }}
          >
            {t("pres.cta.trial")}
          </p>
        </div>
      </div>

      {/* ═══ VIDEO CONTROLS ═══ */}
      <div
        data-controls
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          controlsVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-6 px-6">
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 group hover:h-2.5 transition-all"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-[#00E5A0] rounded-full relative"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#00E5A0] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(0,229,160,0.5)]" />
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-4">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              title={isPlaying ? t("pres.controls.pause") : t("pres.controls.play")}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>

            {/* Replay */}
            <button
              onClick={replay}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              title={t("pres.controls.replay")}
            >
              <RotateCcw className="w-4 h-4 text-white/70" />
            </button>

            {/* Time */}
            <span className="text-sm font-mono text-white/60">
              {formatTime(elapsed)} / {formatTime(TOTAL_DURATION)}
            </span>

            <span className="flex-1" />

            {/* Scene indicator */}
            <div className="hidden md:flex items-center gap-1.5">
              {SCENES.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentScene
                      ? "bg-[#00E5A0] scale-125"
                      : i < currentScene
                      ? "bg-white/40"
                      : "bg-white/15"
                  }`}
                />
              ))}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              title={t("pres.controls.fullscreen")}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 text-white/70" />
              ) : (
                <Maximize className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
