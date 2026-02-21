"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { WebhookHealthDot } from "@/components/dashboard/webhook-health-dot";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Vue d'ensemble",
  "/dashboard/orders": "Commandes",
  "/dashboard/analytics": "Analytique",
  "/dashboard/settings": "Paramètres",
  "/dashboard/compliance": "Conformité",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Prefix match (e.g. /dashboard/orders/123)
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path) && path !== "/dashboard") return title;
  }
  return "nortoo";
}

export function MobileHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

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
