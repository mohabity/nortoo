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
  Zap,
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Zap className="h-6 w-6 text-sun" />
        <span className="font-sora text-lg font-bold text-ink-1">
          COD<span className="text-sun">Pilot</span>
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
                  ? "bg-sun-light text-sun-deep"
                  : "text-ink-3 hover:bg-sand hover:text-ink-2"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan info */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
        <div className="rounded-sm bg-sand p-3">
          <p className="text-xs font-medium text-ink-3">Plan actuel</p>
          <p className="font-sora text-sm font-bold text-ink-1">{planLabel}</p>
          {planDescription && (
            <p className="mt-1 text-xs text-ink-4">{planDescription}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
