"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecisionBadge } from "../decision-badge";

// ── Props ──

interface OverrideSectionProps {
  orderId: number;
  onOverrideSuccess: () => void;
  onRefetch: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// ── Component ──

export function OverrideSection({
  orderId,
  onOverrideSuccess,
  onRefetch,
  t,
}: OverrideSectionProps) {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  async function handleOverride() {
    if (!overrideDecision || !orderId) return;
    setOverrideSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: overrideDecision,
          reason: overrideReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        setOverrideOpen(false);
        setOverrideReason("");
        setOverrideDecision("");
        onRefetch();
        onOverrideSuccess();
      }
    } finally {
      setOverrideSubmitting(false);
    }
  }

  return (
    <div className="mx-6 mt-4 mb-6">
      {!overrideOpen ? (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-mint text-mint-deep hover:bg-mint/10"
            onClick={() => {
              setOverrideDecision("ship");
              setOverrideOpen(true);
            }}
          >
            {t("components.orderSlideOver.forceShip")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-violet text-violet hover:bg-violet/10"
            onClick={() => {
              setOverrideDecision("block");
              setOverrideOpen(true);
            }}
          >
            {t("components.orderSlideOver.block")}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-silk bg-snow p-4 space-y-3">
          <p className="text-sm font-medium text-midnight">
            {t("components.orderSlideOver.overrideAction")}{" "}
            <DecisionBadge decision={overrideDecision} size="sm" />
          </p>
          <div>
            <label className="text-xs text-fog">
              {t("components.orderSlideOver.overrideReasonLabel")}
            </label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder={t("components.orderSlideOver.overrideReasonPlaceholder")}
              className="mt-1 w-full rounded-md border border-silk bg-white px-3 py-2 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-mint/30"
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={overrideSubmitting}
              onClick={handleOverride}
            >
              {overrideSubmitting && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              {t("common.confirm")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOverrideOpen(false);
                setOverrideReason("");
              }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-mist mt-2">
        {t("components.orderSlideOver.overrideAuditNote")}
      </p>
    </div>
  );
}
