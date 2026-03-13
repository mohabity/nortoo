"use client";

import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  archivedAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const fetchNotifications = useCallback(async (archived = false) => {
    try {
      const res = await fetch(`/api/notifications?per_page=15${archived ? "&archived=true" : ""}`);
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
    const interval = setInterval(() => fetchNotifications(), 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when toggling archived view
  useEffect(() => {
    fetchNotifications(showArchived);
  }, [showArchived, fetchNotifications]);

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

  async function archiveNotification(id: number) {
    await fetch(`/api/notifications/${id}/archive`, { method: "PUT" });
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  async function archiveAllRead() {
    setLoading(true);
    await fetch("/api/notifications/archive-read", { method: "PUT" });
    setItems((prev) => prev.filter((n) => !n.read));
    setLoading(false);
  }

  return {
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
  };
}
