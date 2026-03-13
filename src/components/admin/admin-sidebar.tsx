"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, Ticket, ScrollText, LogOut, ShieldCheck, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/nrt-panel", label: "Overview", icon: LayoutDashboard },
  { href: "/nrt-panel/merchants", label: "Merchants", icon: Users },
  { href: "/nrt-panel/invoices", label: "Factures", icon: FileText },
  { href: "/nrt-panel/coupons", label: "Coupons", icon: Ticket },
  { href: "/nrt-panel/tickets", label: "Tickets", icon: Headphones },
  { href: "/nrt-panel/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/nrt-panel/admins", label: "Admins", icon: ShieldCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't render on login page
  if (pathname === "/nrt-panel/login" || pathname.startsWith("/nrt-panel/accept-invite")) return null;

  function handleLogout() {
    document.cookie = "nortoo_admin=; path=/; max-age=0";
    router.push("/nrt-panel/login");
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 hidden lg:flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <Link href="/nrt-panel" className="flex items-center gap-2.5">
          <img src="/nortoo-logo.png" alt="nortoo" className="h-7 w-auto" />
          <span className="text-xs font-medium text-mint bg-mint/10 px-1.5 py-0.5 rounded">
            admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/nrt-panel"
            ? pathname === "/nrt-panel"
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors",
                isActive
                  ? "bg-mint/10 text-mint"
                  : "text-gray-600 hover:text-midnight hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium text-gray-400 hover:text-rose transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
