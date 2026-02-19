"use client";

import { Bell, Search, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/80 backdrop-blur-sm px-6">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-sm border border-border bg-sand/50 px-3 py-2 w-80">
        <Search className="h-4 w-4 text-ink-4" />
        <input
          type="text"
          placeholder="Rechercher une commande..."
          className="bg-transparent text-sm text-ink-2 placeholder:text-ink-4 outline-none w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-coral" />
        </Button>

        <div className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sun-light">
            <User className="h-4 w-4 text-sun-deep" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-1">{merchantName}</p>
            <p className="text-[10px] text-ink-4">Plan {planLabel}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Se déconnecter"
        >
          <LogOut className="h-4 w-4 text-ink-3" />
        </Button>
      </div>
    </header>
  );
}
