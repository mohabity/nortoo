"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { WebhookHealthDot } from "@/components/dashboard/webhook-health-dot";
import { useTranslation } from "@/i18n/provider";

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/dashboard": "nav.overview",
  "/dashboard/orders": "nav.orders",
  "/dashboard/analytics": "nav.analytics",
  "/dashboard/settings": "nav.settings",
  "/dashboard/compliance": "nav.compliance",
};

function getPageTitleKey(pathname: string): string {
  // Exact match first
  if (PAGE_TITLE_KEYS[pathname]) return PAGE_TITLE_KEYS[pathname];
  // Prefix match (e.g. /dashboard/orders/123)
  for (const [path, key] of Object.entries(PAGE_TITLE_KEYS)) {
    if (pathname.startsWith(path) && path !== "/dashboard") return key;
  }
  return "";
}

export function MobileHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const titleKey = getPageTitleKey(pathname);
  const title = titleKey ? t(titleKey) : "nortoo";

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-silk bg-white/80 backdrop-blur-sm px-4 lg:hidden"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* Logo */}
      <img src="/nortoo-logo.png" alt="nortoo" className="h-6 w-auto shrink-0" />

      {/* Page title */}
      <h1 className="font-display text-base font-bold text-midnight truncate px-3">
        {title}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <WebhookHealthDot />
        <NotificationBell />
      </div>
    </header>
  );
}
