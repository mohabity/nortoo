"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LayoutDashboard, Users, FileText, Ticket, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/merchants", label: "Merchants", icon: Users },
  { href: "/admin/invoices", label: "Factures", icon: FileText },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't render on login page
  if (pathname === "/admin/login") return null;

  function handleLogout() {
    document.cookie = "nortoo_admin=; path=/; max-age=0";
    router.push("/admin/login");
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-midnight border-r border-slate hidden lg:flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C8FF00]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#C8FF00]" />
          </div>
          <div>
            <span className="text-sm font-display font-bold text-white">
              nortoo <span className="text-[#C8FF00]">admin</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#C8FF00]/10 text-[#C8FF00]"
                  : "text-mist hover:text-white hover:bg-slate/40"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium text-fog hover:text-rose transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
