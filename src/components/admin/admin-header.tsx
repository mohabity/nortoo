"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ROUTE_TITLES: Record<string, string> = {
  "/nrt-panel": "Overview",
  "/nrt-panel/merchants": "Merchants",
  "/nrt-panel/admins": "Administrateurs",
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't render on login page
  if (pathname === "/nrt-panel/login" || pathname.startsWith("/nrt-panel/accept-invite")) return null;

  const title = ROUTE_TITLES[pathname] ?? "Admin";

  function handleLogout() {
    document.cookie = "nortoo_admin=; path=/; max-age=0";
    router.push("/nrt-panel/login");
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-500 hover:text-midnight"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <h1 className="text-sm font-display font-semibold text-midnight">
            {title}
          </h1>

          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-rose transition-colors lg:hidden"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 p-4">
            <div className="flex items-center gap-2.5 mb-6">
              <img src="/nortoo-logo.png" alt="nortoo" className="h-6 w-auto" />
              <span className="text-xs font-medium text-mint bg-mint/10 px-1.5 py-0.5 rounded">
                admin
              </span>
            </div>
            <nav className="space-y-1">
              {[
                { href: "/nrt-panel", label: "Overview" },
                { href: "/nrt-panel/merchants", label: "Merchants" },
                { href: "/nrt-panel/invoices", label: "Factures" },
                { href: "/nrt-panel/coupons", label: "Coupons" },
                { href: "/nrt-panel/audit-logs", label: "Audit Logs" },
                { href: "/nrt-panel/admins", label: "Admins" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-sm text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-mint/10 text-mint"
                      : "text-gray-600 hover:text-midnight"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 mt-6 text-sm text-gray-400 hover:text-rose"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  );
}
