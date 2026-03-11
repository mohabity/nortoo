"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useTranslation } from "@/i18n/provider";
import { useBilling } from "@/components/billing-context";

const navItems = [
  { href: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", labelKey: "nav.orders", icon: ShoppingCart },
  { href: "/dashboard/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: Settings },
  { href: "/dashboard/compliance", labelKey: "nav.compliance", icon: Shield },
  { href: "/dashboard/guide", labelKey: "nav.guide", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const { t } = useTranslation();
  const { plan: billingPlan, loading: billingLoading } = useBilling();

  // Use real-time plan from BillingProvider (fetches /api/settings/plan),
  // with fallback to JWT session plan (set at login) during loading
  const plan = !billingLoading ? billingPlan : (session?.user?.plan ?? "trial");
  const planLabel = t(`plans.${plan}.name`);
  const planDescription = t(`plans.${plan}.description`);

  // Filter nav items by role
  const filteredNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard/analytics") return can("analytics:read");
    if (item.href === "/dashboard/settings") return can("settings:read");
    if (item.href === "/dashboard/compliance") return can("compliance:read");
    return true;
  });

  return (
    <aside className="hidden lg:block fixed start-0 top-0 z-40 h-screen w-64 border-e border-silk bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-silk px-6">
        <Link href="/dashboard" className="flex items-center">
          <img src="/nortoo-logo.png" alt="nortoo" className="h-7 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
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
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-mint-bg text-mint-deep"
                  : "text-fog hover:bg-snow hover:text-slate"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Plan info — clickable */}
      <div className="absolute bottom-0 start-0 end-0 border-t border-silk p-4">
        <Link
          href="/dashboard/billing"
          className="block rounded-sm bg-snow p-3 hover:bg-mint-bg/30 transition-colors group"
        >
          <p className="text-xs font-medium text-fog">{t("billing.currentPlan")}</p>
          <p className="font-display text-sm font-bold text-midnight">{planLabel}</p>
          {planDescription && (
            <p className="mt-1 text-xs text-mist">
              {planDescription}
              <span className="ms-1 text-mint-deep opacity-0 group-hover:opacity-100 transition-opacity">
                {t("common.manage")}
              </span>
            </p>
          )}
        </Link>
      </div>
    </aside>
  );
}
