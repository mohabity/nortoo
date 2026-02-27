"use client";

import Link from "next/link";
import { Search, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { WebhookHealthDot } from "@/components/dashboard/webhook-health-dot";
import { PlanBadge } from "@/components/plan-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/i18n/provider";
import { useBilling } from "@/components/billing-context";
import type { Role } from "@/lib/permissions.shared";
import type { PlanId } from "@/lib/plans";

export function Header() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const { plan: billingPlan, loading: billingLoading } = useBilling();

  const merchantName = session?.user?.name ?? "Ma Boutique";
  // Use real-time plan from BillingProvider, fallback to JWT during loading
  const plan = (!billingLoading ? billingPlan : (session?.user?.plan ?? "trial")) as PlanId;
  const role = (session?.user?.role ?? "operator") as Role;
  const roleLabel = t(`roles.${role}`);

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-silk bg-white/80 backdrop-blur-sm px-6">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-sm border border-silk bg-snow/50 px-3 py-2 w-80">
        <Search className="h-4 w-4 text-mist" />
        <input
          type="text"
          placeholder={t("header.searchPlaceholder")}
          className="bg-transparent text-sm text-slate placeholder:text-mist outline-none w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <WebhookHealthDot />
        <LanguageSwitcher />
        <NotificationBell />

        <div className="flex items-center gap-2 rounded-sm border border-silk px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mint-bg">
            <User className="h-4 w-4 text-mint-deep" />
          </div>
          <div>
            <p className="text-sm font-medium text-midnight">{merchantName}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-mist">
              <span>{roleLabel}</span>
              <span>·</span>
              <Link href="/dashboard/billing" className="hover:opacity-80 transition-opacity">
                <PlanBadge plan={plan} />
              </Link>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={t("common.logout")}
        >
          <LogOut className="h-4 w-4 text-fog" />
        </Button>
      </div>
    </header>
  );
}
