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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/dashboard/analytics", label: "Analytique", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  { href: "/dashboard/compliance", label: "Conformité", icon: Shield },
];

const PLAN_LABELS: Record<string, string> = {
  trial: "Essai gratuit",
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  trial: "14 jours restants",
  starter: "299 DH/mois",
  growth: "699 DH/mois",
  scale: "1 499 DH/mois",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const plan = session?.user?.plan ?? "trial";
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const planDescription = PLAN_DESCRIPTIONS[plan] ?? "";

  return (
    <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64 border-r border-silk bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-silk px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-mint">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="#0B0F1A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 6h18M7 12h10M10 18h4"/>
          </svg>
        </div>
        <span className="font-display text-lg font-black tracking-[-0.06em] text-midnight">
          Siift
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
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
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan info */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-silk p-4">
        <div className="rounded-sm bg-snow p-3">
          <p className="text-xs font-medium text-fog">Plan actuel</p>
          <p className="font-display text-sm font-bold text-midnight">{planLabel}</p>
          {planDescription && (
            <p className="mt-1 text-xs text-mist">{planDescription}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
