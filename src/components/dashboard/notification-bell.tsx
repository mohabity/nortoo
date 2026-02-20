"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

const SEVERITY_BORDER: Record<string, string> = {
  info: "border-l-mint",
  warning: "border-l-sun",
  critical: "border-l-coral",
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-mint",
  warning: "bg-sun",
  critical: "bg-coral",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?per_page=15");
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.data ?? []);
      setUnreadCount(json.meta?.unreadCount ?? 0);
    } catch {
      // Bell is non-critical UI — silently fail
    }
  }, []);

  // Initial fetch + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function markAsRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications/read-all", { method: "PUT" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setLoading(false);
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] overflow-hidden rounded-lg border border-border bg-white shadow-lg z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-sora text-sm font-semibold text-ink-1">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-ocean hover:text-ocean/80"
              >
                <CheckCheck className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-4">
                Aucune notification
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-sand/50 transition-colors border-l-[3px]",
                    SEVERITY_BORDER[n.severity] ?? "border-l-transparent",
                    !n.read && "bg-sun-light/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          SEVERITY_DOT[n.severity] ?? "bg-ink-4"
                        )}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          n.read ? "text-ink-3" : "font-medium text-ink-1"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-4 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-4">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {n.actionUrl && (
                      <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-ink-4" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
