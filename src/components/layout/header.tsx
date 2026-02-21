"use client";

import { Search, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { WebhookHealthDot } from "@/components/dashboard/webhook-health-dot";
import { ROLE_LABELS, type Role } from "@/lib/permissions.shared";

const PLAN_LABELS: Record<string, string> = {
  trial: "Essai",
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

export function Header() {
  const { data: session } = useSession();

  const merchantName = session?.user?.name ?? "Ma Boutique";
  const plan = session?.user?.plan ?? "trial";
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const role = (session?.user?.role ?? "operator") as Role;
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-silk bg-white/80 backdrop-blur-sm px-6">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-sm border border-silk bg-snow/50 px-3 py-2 w-80">
        <Search className="h-4 w-4 text-mist" />
        <input
          type="text"
          placeholder="Rechercher une commande..."
          className="bg-transparent text-sm text-slate placeholder:text-mist outline-none w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <WebhookHealthDot />
        <NotificationBell />

        <div className="flex items-center gap-2 rounded-sm border border-silk px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mint-bg">
            <User className="h-4 w-4 text-mint-deep" />
          </div>
          <div>
            <p className="text-sm font-medium text-midnight">{merchantName}</p>
            <p className="text-[10px] text-mist">{roleLabel} · Plan {planLabel}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Se déconnecter"
        >
          <LogOut className="h-4 w-4 text-fog" />
        </Button>
      </div>
    </header>
  );
}
