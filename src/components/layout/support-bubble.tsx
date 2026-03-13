"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, X, ExternalLink, Ticket, HelpCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";
import { useToast } from "@/components/ui/toast";
import { TicketForm } from "@/app/dashboard/support/_components/ticket-form";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "212600000000";

export function SupportBubble() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Bonjour, j'ai besoin d'aide avec nortoo."
  )}`;

  const handleCreateTicket = async (data: {
    subject: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      addToast({
        type: "error",
        message: t("support.form.error"),
      });
      throw new Error(json.error);
    }
    addToast({
      type: "success",
      message: t("support.form.success"),
    });
    setShowForm(false);
    setOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setShowForm(false); }}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center justify-center h-12 w-12 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        aria-label={t("support.bubble.title")}
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {/* Support sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display">
              {t("support.bubble.title")}
            </SheetTitle>
            <SheetDescription>
              {showForm
                ? t("support.form.description")
                : t("support.subtitle")}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {!showForm ? (
              <>
                {/* FAQ option */}
                <Link
                  href="/dashboard/faq"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-sm border border-silk hover:bg-snow transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-violet-bg text-violet shrink-0">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-midnight">
                      {t("support.bubble.faq")}
                    </p>
                    <p className="text-xs text-fog">
                      {t("support.bubble.faqHint")}
                    </p>
                  </div>
                </Link>

                {/* WhatsApp option */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-sm border border-silk hover:bg-snow transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#25D366] text-white shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-midnight">
                      {t("support.bubble.whatsapp")}
                    </p>
                    <p className="text-xs text-fog">
                      {t("support.bubble.whatsappHint")}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-mist shrink-0" />
                </a>

                {/* Create ticket option */}
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-4 p-4 rounded-sm border border-silk hover:bg-snow transition-colors w-full text-left"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-mint/15 text-mint-deep shrink-0">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-midnight">
                      {t("support.bubble.newTicket")}
                    </p>
                    <p className="text-xs text-fog">
                      {t("support.bubble.ticketHint")}
                    </p>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-fog"
                >
                  ← {t("common.back")}
                </Button>
                <TicketForm onSubmit={handleCreateTicket} compact />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
