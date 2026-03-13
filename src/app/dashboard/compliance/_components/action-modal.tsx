"use client";

import { useState } from "react";
import { Eye, Loader2, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/provider";

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: typeof Eye;
  iconColor: string;
  actionLabel: string;
  actionVariant?: "default" | "destructive";
  showReason?: boolean;
  onSubmit: (phone: string, reason?: string) => void;
  result: React.ReactNode | null;
  loading: boolean;
}

export function ActionModal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  iconColor,
  actionLabel,
  actionVariant = "default",
  showReason = false,
  onSubmit,
  result,
  loading,
}: ActionModalProps) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded bg-white shadow-xl border border-silk max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-silk">
          <div className="flex items-center gap-3">
            <div className={`rounded-sm p-2 ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-midnight">{title}</h3>
              <p className="text-xs text-fog">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-fog hover:text-midnight">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-fog mb-1.5 block">
              {t("compliance.actions.phoneLabel")}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("compliance.actions.phonePlaceholder")}
                className="w-full rounded-sm border border-silk bg-snow pl-10 pr-4 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
              />
            </div>
          </div>
          {showReason && (
            <div>
              <label className="text-xs font-medium text-fog mb-1.5 block">
                {t("compliance.actions.reasonLabel")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("compliance.actions.reasonPlaceholder")}
                rows={2}
                className="w-full rounded-sm border border-silk bg-snow px-4 py-2.5 text-sm text-midnight placeholder:text-mist focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint resize-none"
              />
            </div>
          )}
          <Button
            onClick={() => onSubmit(phone, reason)}
            disabled={!phone.trim() || loading}
            className={`w-full ${actionVariant === "destructive" ? "bg-rose hover:bg-rose/90 text-white" : ""}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {actionLabel}
          </Button>
          {result && <div className="mt-2">{result}</div>}
        </div>
      </div>
    </div>
  );
}
