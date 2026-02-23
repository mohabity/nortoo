"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldBan,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  Bot,
  UserRound,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatDate } from "@/lib/i18n-utils";
import type { BaseTabProps } from "../types";

interface PhoneListEntry {
  id: number;
  phoneMasked: string;
  listType: string;
  reason: string | null;
  addedBy: string;
  createdAt: string;
}

type ListFilter = "all" | "whitelist" | "blacklist";

export function PhoneListTab({ onToast }: BaseTabProps) {
  const { t, locale } = useTranslation();
  const [entries, setEntries] = useState<PhoneListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ListFilter>("all");

  // Add form
  const [phone, setPhone] = useState("");
  const [listType, setListType] = useState<"whitelist" | "blacklist">("blacklist");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const params = filter !== "all" ? `?type=${filter}` : "";
      const res = await fetch(`/api/phone-list${params}`);
      const json = await res.json();
      if (json.data) {
        setEntries(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchEntries();
  }, [fetchEntries]);

  // Add handler
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/phone-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          listType,
          reason: reason.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        onToast("error", json.error || t("phoneList.error"));
        return;
      }
      onToast("success", t("phoneList.added"));
      setPhone("");
      setReason("");
      fetchEntries();
    } catch {
      onToast("error", t("phoneList.error"));
    } finally {
      setAdding(false);
    }
  }

  // Delete handler
  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/phone-list?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        onToast("error", json.error || t("phoneList.error"));
        return;
      }
      onToast("success", t("phoneList.removed"));
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      onToast("error", t("phoneList.error"));
    } finally {
      setDeletingId(null);
    }
  }

  const whitelist = entries.filter((e) => e.listType === "whitelist");
  const blacklist = entries.filter((e) => e.listType === "blacklist");
  const displayed = filter === "all" ? entries : filter === "whitelist" ? whitelist : blacklist;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5 text-rose" />
            {t("phoneList.title")}
          </CardTitle>
          <CardDescription>
            {t("phoneList.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-mint-bg rounded-sm">
              <ShieldCheck className="h-4 w-4 text-mint-deep" />
              <span className="text-sm font-medium text-mint-deep">
                {whitelist.length} {t("phoneList.whitelist")}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-rose/5 rounded-sm">
              <ShieldBan className="h-4 w-4 text-rose" />
              <span className="text-sm font-medium text-rose">
                {blacklist.length} {t("phoneList.blacklist")}
              </span>
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 p-4 bg-snow rounded-sm border border-silk">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-fog mb-1">
                {t("phoneList.addPhone")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0661234567"
                className="w-full rounded-sm border border-silk px-3 py-2 text-sm text-midnight placeholder:text-mist focus:ring-1 focus:ring-mint/40 focus:border-mint focus:outline-none"
                required
                minLength={8}
                maxLength={20}
                dir="ltr"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-fog mb-1">
                {t("phoneList.listTypeLabel")}
              </label>
              <select
                value={listType}
                onChange={(e) => setListType(e.target.value as "whitelist" | "blacklist")}
                className="w-full rounded-sm border border-silk px-3 py-2 text-sm text-midnight cursor-pointer focus:ring-1 focus:ring-mint/40 focus:outline-none"
              >
                <option value="blacklist">{t("phoneList.blacklist")}</option>
                <option value="whitelist">{t("phoneList.whitelist")}</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-fog mb-1">
                {t("phoneList.reason")}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("phoneList.reasonPlaceholder")}
                maxLength={200}
                className="w-full rounded-sm border border-silk px-3 py-2 text-sm text-midnight placeholder:text-mist focus:ring-1 focus:ring-mint/40 focus:border-mint focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              disabled={adding || !phone.trim()}
              className="bg-mint text-midnight hover:bg-mint/90 font-medium"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {t("phoneList.add")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filter tabs + Table */}
      <Card>
        <CardContent className="pt-6">
          {/* Filter */}
          <div className="flex gap-1 mb-4">
            {(["all", "whitelist", "blacklist"] as ListFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                  filter === f
                    ? "bg-midnight text-white"
                    : "bg-snow text-fog hover:bg-silk/50"
                )}
              >
                {f === "all" && t("phoneList.filterAll")}
                {f === "whitelist" && t("phoneList.whitelist")}
                {f === "blacklist" && t("phoneList.blacklist")}
                <span className="ml-1 opacity-60">
                  ({f === "all" ? entries.length : f === "whitelist" ? whitelist.length : blacklist.length})
                </span>
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-mist" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12 text-sm text-fog">
              {t("phoneList.empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-silk">
                    <th className="text-left py-2 px-3 text-xs font-medium text-fog uppercase tracking-wide">
                      {t("phoneList.colPhone")}
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-fog uppercase tracking-wide">
                      {t("phoneList.colType")}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-fog uppercase tracking-wide">
                      {t("phoneList.colReason")}
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-fog uppercase tracking-wide">
                      {t("phoneList.colSource")}
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-fog uppercase tracking-wide">
                      {t("phoneList.colDate")}
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-silk/50 hover:bg-snow/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-midnight">
                        {entry.phoneMasked}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                            entry.listType === "whitelist"
                              ? "bg-mint/10 text-mint-deep border-mint/20"
                              : "bg-rose/10 text-rose border-rose/20"
                          )}
                        >
                          {entry.listType === "whitelist" ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <ShieldBan className="h-3 w-3" />
                          )}
                          {entry.listType === "whitelist"
                            ? t("phoneList.whitelist")
                            : t("phoneList.blacklist")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-fog max-w-[200px] truncate">
                        {entry.reason || "\u2014"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                            entry.addedBy === "auto"
                              ? "bg-amber/10 text-amber border-amber/20"
                              : "bg-ocean/10 text-ocean border-ocean/20"
                          )}
                        >
                          {entry.addedBy === "auto" ? (
                            <Bot className="h-3 w-3" />
                          ) : (
                            <UserRound className="h-3 w-3" />
                          )}
                          {entry.addedBy === "auto"
                            ? t("phoneList.auto")
                            : t("phoneList.manual")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-fog text-xs">
                        {formatDate(entry.createdAt, locale)}
                      </td>
                      <td className="py-3 px-1">
                        {deletingId === entry.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-xs text-rose font-medium hover:underline"
                            >
                              {t("phoneList.confirmYes")}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-xs text-fog hover:underline"
                            >
                              {t("phoneList.confirmNo")}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(entry.id)}
                            className="p-1.5 rounded-sm text-mist hover:text-rose hover:bg-rose/5 transition-colors"
                            title={t("phoneList.remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
