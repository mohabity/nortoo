"use client";

import { useEffect, useRef } from "react";
import { trackEvent, LANDING_EVENTS } from "@/lib/analytics";

const THRESHOLDS = [25, 50, 75, 100];

/**
 * Tracks scroll depth milestones (25%, 50%, 75%, 100%).
 * Fires once per threshold per page view.
 * Drop into any page — renders nothing.
 */
export function ScrollTracker() {
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const t of THRESHOLDS) {
        if (pct >= t && !firedRef.current.has(t)) {
          firedRef.current.add(t);
          trackEvent(LANDING_EVENTS.SCROLL_DEPTH, { depth: t });
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
