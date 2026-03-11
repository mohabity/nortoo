"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Settings,
  MoreHorizontal,
  Shield,
  BookOpen,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useTranslation } from "@/i18n/provider";

const navItems = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/dashboard/orders", labelKey: "nav.orders", icon: ShoppingCart },
  { href: "/dashboard/crm", labelKey: "nav.crm", icon: Users },
  { href: "/dashboard/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
];

const moreItems = [
  { href: "/dashboard/compliance", labelKey: "nav.compliance", icon: Shield },
  { href: "/dashboard/guide", labelKey: "nav.guide", icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { can } = usePermissions();
  const { t } = useTranslation();

  // Filter nav items by role
  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard/analytics") return can("analytics:read");
    if (item.href === "/dashboard/settings") return can("settings:read");
    return true;
  });

  const filteredMoreItems = moreItems.filter((item) => {
    if (item.href === "/dashboard/compliance") return can("compliance:read");
    return true;
  });

  const isMoreActive = filteredMoreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* "More" overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* "More" popup menu */}
      {moreOpen && (
        <div className="fixed bottom-20 right-4 z-50 rounded-sm border border-silk bg-white shadow-lg lg:hidden">
          {filteredMoreItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "text-mint-deep bg-mint-bg"
                    : "text-fog hover:bg-snow hover:text-slate"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-silk bg-white lg:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {filteredNavItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-colors",
                  isActive ? "text-mint-deep" : "text-fog"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-6 rounded-full bg-mint" />
                )}
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}

          {/* More button — only show if there are items in the overflow menu */}
          {filteredMoreItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-colors",
                isMoreActive ? "text-mint-deep" : "text-fog"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t("nav.more")}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
