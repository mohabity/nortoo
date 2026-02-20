"use client";

import { useEffect, useState, useCallback } from "react";
import {
  User,
  Store,
  Sliders,
  KeyRound,
  Bell,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabId, TabMeta, MerchantSettings, Toast } from "./types";
import { ScoringTab } from "./components/ScoringTab";
import { ApiTab } from "./components/ApiTab";
import { ProfileTab } from "./components/ProfileTab";
import { StoreTab } from "./components/StoreTab";
import { NotificationsTab } from "./components/NotificationsTab";
import { PrivacyTab } from "./components/PrivacyTab";

// ── Tab definitions ──
const TABS: TabMeta[] = [
  { id: "profile", label: "Profil", icon: User },
  { id: "store", label: "Boutique", icon: Store },
  { id: "scoring", label: "Scoring", icon: Sliders },
  { id: "api", label: "Intégration & API", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Données & Confidentialité", icon: ShieldCheck },
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

// ── Page ──
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("scoring");
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.data) {
        setSettings(json.data as MerchantSettings);
      }
    } catch {
      // silently fail
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
  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-mist" />
        <span className="ml-2 text-sm text-fog">Chargement...</span>
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
        <h1 className="font-display text-2xl font-bold text-midnight">Paramètres</h1>
        <p className="text-sm text-fog">
          Configuration de votre compte et intégrations
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
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab {...baseProps} />}
          {activeTab === "store" && <StoreTab {...baseProps} />}
          {activeTab === "scoring" && <ScoringTab {...baseProps} />}
          {activeTab === "api" && <ApiTab {...baseProps} />}
          {activeTab === "notifications" && <NotificationsTab {...baseProps} />}
          {activeTab === "privacy" && <PrivacyTab {...baseProps} />}
        </div>
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
