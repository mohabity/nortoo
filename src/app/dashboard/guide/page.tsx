"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, ArrowUp, Menu, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SECTIONS } from "./_components/guide-config";
import { TableOfContents } from "./_components/table-of-contents";
import { GuideSections } from "./_components/guide-sections";

export default function GuidePage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // Back to top button
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="space-y-6" ref={mainRef}>
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">
          Guide utilisateur
        </h1>
        <p className="text-sm text-fog mt-1">
          Tout ce que vous devez savoir pour utiliser nortoo efficacement.
        </p>
      </div>

      {/* Mobile TOC toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-silk bg-white px-4 py-3 text-sm font-medium text-slate"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-mint" />
            Sommaire
          </span>
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        {mobileNavOpen && (
          <Card className="mt-2">
            <CardContent className="p-3">
              <TableOfContents
                activeId={activeId}
                onSelect={() => setMobileNavOpen(false)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Desktop sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-fog uppercase tracking-wider mb-3 px-3">
              Sommaire
            </p>
            <TableOfContents activeId={activeId} />
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-12">
          <GuideSections />
        </div>
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-6 lg:bottom-8 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-mint text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
