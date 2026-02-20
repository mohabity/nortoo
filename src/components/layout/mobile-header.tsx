"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/dashboard/notification-bell";

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
  return "Siift";
}

export function MobileHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-silk bg-white/80 backdrop-blur-sm px-4 lg:hidden"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* Logo icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-mint shrink-0">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0B0F1A"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M3 6h18M7 12h10M10 18h4" />
        </svg>
      </div>

      {/* Page title */}
      <h1 className="font-display text-base font-bold text-midnight truncate px-3">
        {title}
      </h1>

      {/* Notification bell */}
      <div className="shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
}
