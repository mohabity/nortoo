/**
 * Client-side event tracking via Umami.
 * No-op if Umami is not loaded — safe to call anywhere.
 */

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, string | number>) => void;
    };
  }
}

/** Send a custom event to Umami (no-op if not loaded) */
export function trackEvent(
  name: string,
  data?: Record<string, string | number>
): void {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(name, data);
  }
}

/** Landing page events */
export const LANDING_EVENTS = {
  CTA_CLICK: "landing_cta_click",
  SCROLL_DEPTH: "landing_scroll_depth",
  PRICING_CLICK: "landing_pricing_click",
  LANG_SWITCH: "landing_lang_switch",
} as const;

/** Blog events */
export const BLOG_EVENTS = {
  CTA_CLICK: "blog_cta_click",
  SHARE: "blog_share",
  READ_COMPLETE: "blog_read_complete",
  RELATED_CLICK: "blog_related_click",
} as const;

/** App events */
export const APP_EVENTS = {
  LOGIN: "app_login",
  VIEW_SCORE: "app_view_score",
  EXPORT: "app_export",
  SCORING_CONFIG: "app_scoring_config",
  ONBOARDING_STEP: "app_onboarding_step",
  PLAN_CHANGE: "app_plan_change",
} as const;
