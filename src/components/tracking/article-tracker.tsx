"use client";

import { useEffect, useRef } from "react";
import { trackEvent, BLOG_EVENTS } from "@/lib/analytics";

/**
 * Fires `blog_read_complete` when the user scrolls to the
 * bottom of the article (IntersectionObserver on a sentinel div).
 * Place at the end of the article content.
 */
export function ArticleTracker({ slug }: { slug: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          trackEvent(BLOG_EVENTS.READ_COMPLETE, { slug });
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [slug]);

  return <div ref={sentinelRef} aria-hidden="true" className="h-1" />;
}
