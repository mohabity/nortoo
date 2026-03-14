"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Headphones,
  HelpCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTranslation } from "@/i18n/provider";
import { useToast } from "@/components/ui/toast";
import { useTickets, type SupportTicket } from "@/hooks/use-tickets";
import { TicketForm } from "./_components/ticket-form";

interface TicketReply {
  id: number;
  ticketId: number;
  senderType: "admin" | "merchant";
  senderName: string;
  message: string;
  createdAt: string;
}

const statusFilters = ["all", "open", "in_progress", "resolved", "closed"] as const;

const statusBadgeVariant: Record<string, "mint" | "amber" | "ocean" | "default" | "rose"> = {
  open: "ocean",
  in_progress: "amber",
  resolved: "mint",
  closed: "default",
};

const priorityBadgeVariant: Record<string, "default" | "amber" | "rose"> = {
  low: "default",
  normal: "amber",
  high: "rose",
};

const categoryBadgeVariant: Record<string, "mint" | "rose" | "ocean" | "violet" | "default"> = {
  scoring: "mint",
  orders: "rose",
  integration: "ocean",
  billing: "violet",
  other: "default",
};

export default function SupportPage() {
  const { t, locale } = useTranslation();
  const { addToast } = useToast();
  const {
    tickets,
    meta,
    loading,
    statusFilter,
    setStatusFilter,
    fetchTickets,
    createTicket,
    closeTicket,
  } = useTickets();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [closing, setClosing] = useState(false);

  // Reply state
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch replies when a ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setReplies([]);
      setReplyText("");
      return;
    }
    const fetchReplies = async () => {
      setLoadingReplies(true);
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/replies`);
      if (res.ok) {
        const json = await res.json();
        setReplies(json.data ?? []);
      }
      setLoadingReplies(false);
    };
    fetchReplies();
  }, [selectedTicket?.id]);

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setReplies((prev) => [...prev, json.data]);
        setReplyText("");
      } else {
        const json = await res.json().catch(() => ({}));
        addToast({ type: "error", message: json.error ?? t("common.error") });
      }
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreate = async (data: {
    subject: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    try {
      await createTicket(data);
      addToast({ type: "success", message: t("support.form.success") });
      setShowCreate(false);
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : t("support.form.error"),
      });
    }
  };

  const handleClose = async (id: number) => {
    setClosing(true);
    try {
      await closeTicket(id);
      setSelectedTicket(null);
      addToast({ type: "success", message: t("support.close") });
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setClosing(false);
    }
  };

  // KPI counts
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const canReply = selectedTicket && (selectedTicket.status === "open" || selectedTicket.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Headphones className="h-6 w-6 text-mint" />
            <h1 className="font-display text-2xl font-bold text-midnight">
              {t("support.title")}
            </h1>
          </div>
          <p className="text-sm text-fog">{t("support.subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t("support.bubble.newTicket")}
        </Button>
      </div>

      {/* FAQ banner */}
      <Link
        href="/dashboard/faq"
        className="flex items-center gap-3 p-3 rounded-sm border border-silk bg-violet-bg/30 hover:bg-violet-bg/50 transition-colors"
      >
        <HelpCircle className="h-5 w-5 text-violet shrink-0" />
        <p className="text-sm text-slate">
          <span className="font-medium">{t("support.faqBanner")}</span>
        </p>
      </Link>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-midnight">{openCount}</p>
            <p className="text-xs text-fog">{t("support.kpi.open")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-midnight">{inProgressCount}</p>
            <p className="text-xs text-fog">{t("support.kpi.inProgress")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-midnight">{resolvedCount}</p>
            <p className="text-xs text-fog">{t("support.kpi.resolved")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "bg-midnight text-white"
                : "bg-snow text-slate hover:bg-silk"
            }`}
          >
            {s === "all" ? t("faq.allCategories") : t(`support.status.${s}`)}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-mist" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-fog text-sm">
          {t("support.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-snow/50 transition-colors"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-midnight truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-fog mt-1 line-clamp-1">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={categoryBadgeVariant[ticket.category] ?? "default"}>
                      {t(`support.categories.${ticket.category}`)}
                    </Badge>
                    <Badge variant={statusBadgeVariant[ticket.status] ?? "default"}>
                      {t(`support.status.${ticket.status}`)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-mist">
                    {formatDate(ticket.createdAt)}
                  </span>
                  <Badge variant={priorityBadgeVariant[ticket.priority] ?? "default"}>
                    {t(`support.priority.${ticket.priority}`)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchTickets(p)}
              className={`px-3 py-1 rounded-xs text-xs font-semibold transition-colors ${
                meta.page === p
                  ? "bg-midnight text-white"
                  : "bg-snow text-slate hover:bg-silk"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create ticket sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display">
              {t("support.bubble.newTicket")}
            </SheetTitle>
            <SheetDescription>{t("support.form.description")}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TicketForm onSubmit={handleCreate} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Ticket detail sheet */}
      <Sheet
        open={!!selectedTicket}
        onOpenChange={(v) => !v && setSelectedTicket(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">
                  {selectedTicket.subject}
                </SheetTitle>
                <SheetDescription>
                  #{selectedTicket.id} · {formatDate(selectedTicket.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={categoryBadgeVariant[selectedTicket.category] ?? "default"}>
                    {t(`support.categories.${selectedTicket.category}`)}
                  </Badge>
                  <Badge variant={statusBadgeVariant[selectedTicket.status] ?? "default"}>
                    {t(`support.status.${selectedTicket.status}`)}
                  </Badge>
                  <Badge variant={priorityBadgeVariant[selectedTicket.priority] ?? "default"}>
                    {t(`support.priority.${selectedTicket.priority}`)}
                  </Badge>
                </div>

                <div className="p-4 rounded-sm bg-snow border border-silk">
                  <p className="text-sm text-slate whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Replies thread */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-midnight">
                    Conversation
                  </h3>
                  {loadingReplies ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-mist" />
                    </div>
                  ) : replies.length === 0 ? (
                    <p className="text-xs text-fog py-2">
                      Aucune réponse pour le moment
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                      {replies.map((r) => (
                        <div
                          key={r.id}
                          className={`p-3 rounded-sm text-sm ${
                            r.senderType === "admin"
                              ? "bg-mint/5 border-l-2 border-mint mr-4"
                              : "bg-snow border-l-2 border-silk ml-4"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-midnight">
                              {r.senderName}
                              <span className="ml-1 text-fog font-normal">
                                ({r.senderType === "admin" ? "Support" : "Vous"})
                              </span>
                            </span>
                            <span className="text-xs text-fog">
                              {formatDateTime(r.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate whitespace-pre-wrap">
                            {r.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  {canReply && (
                    <div className="flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Écrire une réponse..."
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-sm border border-silk text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            sendReply();
                          }
                        }}
                      />
                      <Button
                        onClick={sendReply}
                        disabled={sendingReply || !replyText.trim()}
                        size="sm"
                        className="self-end"
                      >
                        {sendingReply ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {selectedTicket.resolvedAt && (
                  <div className="flex items-center gap-2 text-xs text-fog">
                    <CheckCircle2 className="h-3.5 w-3.5 text-mint" />
                    {t("support.close")} · {formatDate(selectedTicket.resolvedAt)}
                  </div>
                )}

                {selectedTicket.status === "open" ||
                selectedTicket.status === "in_progress" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleClose(selectedTicket.id)}
                    disabled={closing}
                    className="w-full"
                  >
                    {closing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <X className="h-4 w-4 mr-1" />
                    {t("support.close")}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
