"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ExternalLink, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/i18n/provider";
import { useNotifications, type Notification } from "@/hooks/use-notifications";

const SEVERITY_BORDER: Record<string, string> = {
  info: "border-l-mint",
  warning: "border-l-amber",
  critical: "border-l-rose",
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-mint",
  warning: "bg-amber",
  critical: "bg-rose",
};

function timeAgo(dateStr: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("components.notifications.timeAgo.justNow");
  if (minutes < 60) return t("components.notifications.timeAgo.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("components.notifications.timeAgo.hours", { count: hours });
  const days = Math.floor(hours / 24);
  return t("components.notifications.timeAgo.days", { count: days });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const {
    items,
    unreadCount,
    loading,
    showArchived,
    setShowArchived,
    fetchNotifications,
    markAsRead,
    markAllRead,
    archiveNotification,
    archiveAllRead,
  } = useNotifications();

  // Close on click outside (desktop only)
  useEffect(() => {
    if (isMobile) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, isMobile]);

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) markAsRead(notification.id);
    if (notification.actionUrl) window.location.href = notification.actionUrl;
    setOpen(false);
  }

  const notificationList = (
    <NotificationList
      items={items}
      unreadCount={unreadCount}
      loading={loading}
      showArchived={showArchived}
      onToggleArchived={setShowArchived}
      onMarkAllRead={markAllRead}
      onArchiveAllRead={archiveAllRead}
      onArchiveOne={(e, id) => { e.stopPropagation(); archiveNotification(id); }}
      onItemClick={handleNotificationClick}
      t={t}
    />
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications(showArchived);
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Desktop: dropdown */}
      {!isMobile && open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] overflow-hidden rounded-lg border border-silk bg-white shadow-lg z-50 flex flex-col">
          {notificationList}
        </div>
      )}

      {/* Mobile: bottom sheet */}
      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[80vh] rounded-t-2xl flex flex-col"
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="flex justify-center py-2">
              <div className="h-1 w-10 rounded-full bg-silk" />
            </div>
            <SheetHeader className="sr-only">
              <SheetTitle>{t("components.notifications.title")}</SheetTitle>
            </SheetHeader>
            {notificationList}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

// ── Sub-component: the notification list UI ──

function NotificationList({
  items,
  unreadCount,
  loading,
  showArchived,
  onToggleArchived,
  onMarkAllRead,
  onArchiveAllRead,
  onArchiveOne,
  onItemClick,
  t,
}: {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  showArchived: boolean;
  onToggleArchived: (v: boolean) => void;
  onMarkAllRead: () => void;
  onArchiveAllRead: () => void;
  onArchiveOne: (e: React.MouseEvent, id: number) => void;
  onItemClick: (n: Notification) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-silk px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-midnight">
          {t("components.notifications.title")}
        </h3>
        <div className="flex items-center gap-2">
          {!showArchived && unreadCount > 0 && (
            <button onClick={onMarkAllRead} disabled={loading} className="flex items-center gap-1 text-xs text-ocean hover:text-ocean/80">
              <CheckCheck className="h-3 w-3" />
              {t("components.notifications.markAllRead")}
            </button>
          )}
          {!showArchived && items.some((n) => n.read) && (
            <button onClick={onArchiveAllRead} disabled={loading} className="flex items-center gap-1 text-xs text-fog hover:text-midnight">
              <Archive className="h-3 w-3" />
              {t("components.notifications.archiveRead")}
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-silk">
        <button
          onClick={() => onToggleArchived(false)}
          className={cn("flex-1 py-2 text-xs font-medium transition-colors", !showArchived ? "text-ocean border-b-2 border-ocean" : "text-mist hover:text-fog")}
        >
          {t("components.notifications.active")}
        </button>
        <button
          onClick={() => onToggleArchived(true)}
          className={cn("flex-1 py-2 text-xs font-medium transition-colors", showArchived ? "text-ocean border-b-2 border-ocean" : "text-mist hover:text-fog")}
        >
          {t("components.notifications.archived")}
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-mist">
            {showArchived ? t("components.notifications.noArchived") : t("components.notifications.empty")}
          </div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              onClick={() => onItemClick(n)}
              className={cn(
                "group w-full text-left px-4 py-3 border-b border-silk/50 hover:bg-snow/50 transition-colors border-l-[3px]",
                SEVERITY_BORDER[n.severity] ?? "border-l-transparent",
                !n.read && !showArchived && "bg-amber-bg",
                showArchived && "opacity-60"
              )}
            >
              <div className="flex items-start gap-2">
                {!n.read && !showArchived && (
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[n.severity] ?? "bg-mist")} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", n.read || showArchived ? "text-fog" : "font-medium text-midnight")}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-mist line-clamp-2">{n.message}</p>
                  <p className="mt-1 text-[11px] text-mist">{timeAgo(n.createdAt, t)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!showArchived && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => onArchiveOne(e, n.id)}
                      className="mt-1 hidden group-hover:block p-0.5 text-mist hover:text-fog"
                      title={t("components.notifications.archive")}
                    >
                      <Archive className="h-3 w-3" />
                    </span>
                  )}
                  {n.actionUrl && <ExternalLink className="mt-1 h-3 w-3 text-mist" />}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
