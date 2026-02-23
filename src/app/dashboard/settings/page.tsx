"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Users,
  Store,
  Sliders,
  KeyRound,
  Bell,
  ShieldCheck,
  Coins,
  Timer,
  CreditCard,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import type { TabId, TabMeta, MerchantSettings, Toast } from "./types";
import { ScoringTab } from "./components/ScoringTab";
import { EscalationTab } from "./components/EscalationTab";
import { ApiTab } from "./components/ApiTab";
import { ProfileTab } from "./components/ProfileTab";
import { StoreTab } from "./components/StoreTab";
import { NotificationsTab } from "./components/NotificationsTab";
import { PrivacyTab } from "./components/PrivacyTab";
import { RtoCostsTab } from "./components/RtoCostsTab";
import { TeamTab } from "./components/TeamTab";
import { BillingTab } from "./components/BillingTab";

// ── Tab definitions ──
const TABS: TabMeta[] = [
  { id: "profile", labelKey: "settings.tabs.profile", icon: User },
  { id: "store", labelKey: "settings.tabs.store", icon: Store },
  { id: "team", labelKey: "settings.tabs.team", icon: Users },
  { id: "scoring", labelKey: "settings.tabs.scoring", icon: Sliders },
  { id: "escalation", labelKey: "settings.tabs.escalation", icon: Timer },
  { id: "rto_costs", labelKey: "settings.tabs.rto_costs", icon: Coins },
  { id: "api", labelKey: "settings.tabs.api", icon: KeyRound },
  { id: "notifications", labelKey: "settings.tabs.notifications", icon: Bell },
  { id: "privacy", labelKey: "settings.tabs.privacy", icon: ShieldCheck },
  { id: "billing", labelKey: "settings.tabs.billing", icon: CreditCard },
];

// ── Toast item ──
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-sm border bg-white px-4 py-3 shadow-lg animate-in slide-in-from-right-5",
        toast.type === "success" && "border-l-4 border-l-mint",
        toast.type === "error" && "border-l-4 border-l-rose",
        toast.type === "info" && "border-l-4 border-l-ocean"
      )}
    >
      <p className="text-sm text-slate flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-mist hover:text-slate"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Tab resolver from URL ──
const TAB_IDS = TABS.map((t) => t.id);

function useInitialTab(): TabId {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabId | null;
  if (urlTab && TAB_IDS.includes(urlTab)) return urlTab;
  return "scoring";
}

// ── Inner page (needs Suspense for useSearchParams) ──
function SettingsPageInner() {
  const { t } = useTranslation();
  const initialTab = useInitialTab();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setFetchError(null);
      setLoading(true);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (!res.ok || !json.data) {
        setFetchError(json.error || "Failed to load settings");
        return;
      }
      setSettings(json.data as MerchantSettings);
    } catch {
      setFetchError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Toast helpers
  const addToast = useCallback(
    (type: Toast["type"], message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
        <span className="ml-2 text-sm text-fog">{t("common.loading")}</span>
      </div>
    );
  }

  // Error state
  if (fetchError || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-rose">{fetchError || t("common.error")}</p>
        <button
          onClick={fetchSettings}
          className="rounded-sm bg-mint px-4 py-2 text-sm font-medium text-midnight hover:bg-mint/90 transition-colors"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const baseProps = {
    settings,
    onRefresh: fetchSettings,
    onToast: addToast,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-midnight">{t("settings.title")}</h1>
        <p className="text-sm text-fog">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Tab Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar / Tab Navigation */}
        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-x-visible lg:w-[220px] lg:shrink-0 pb-2 lg:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2.5 min-h-[44px] text-sm font-medium text-left transition-colors",
                  "lg:border-l-[3px]",
                  isActive
                    ? "bg-mint-bg text-mint-deep lg:border-l-mint"
                    : "text-fog hover:bg-snow hover:text-slate lg:border-l-transparent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab {...baseProps} />}
          {activeTab === "store" && <StoreTab {...baseProps} />}
          {activeTab === "team" && <TeamTab {...baseProps} />}
          {activeTab === "scoring" && <ScoringTab {...baseProps} />}
          {activeTab === "escalation" && <EscalationTab {...baseProps} />}
          {activeTab === "rto_costs" && <RtoCostsTab {...baseProps} />}
          {activeTab === "api" && <ApiTab {...baseProps} />}
          {activeTab === "notifications" && <NotificationsTab {...baseProps} />}
          {activeTab === "privacy" && <PrivacyTab {...baseProps} />}
          {activeTab === "billing" && <BillingTab {...baseProps} />}
        </div>
      </div>

      {/* Legal footer */}
      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-ink-3 space-x-4">
        <a href="/privacy" className="hover:text-ink-2 transition">
          Confidentialité
        </a>
        <span>·</span>
        <a href="/terms" className="hover:text-ink-2 transition">
          CGU
        </a>
        <span>·</span>
        <a href="/data-rights" className="hover:text-ink-2 transition">
          Droits des données
        </a>
        <span>·</span>
        <span>
          © {new Date().getFullYear()} nortoo — Déclaration CNDP
          n°[À compléter]
        </span>
      </div>

      {/* Toast container — above bottom nav on mobile */}
      <div className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:right-6 lg:left-auto z-50 space-y-2 lg:w-[340px]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </div>
  );
}

// ── Page (Suspense boundary for useSearchParams) ──
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
        </div>
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}
