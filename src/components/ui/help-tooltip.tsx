"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/i18n/provider";
import { Tooltip } from "./tooltip";

interface HelpTooltipProps {
  textKey: string;
  guideSection?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({
  textKey,
  guideSection,
  side = "top",
}: HelpTooltipProps) {
  const { t } = useTranslation();

  return (
    <Tooltip
      side={side}
      content={
        <div className="space-y-1.5">
          <p className="leading-relaxed">{t(textKey)}</p>
          {guideSection && (
            <Link
              href={`/dashboard/guide#${guideSection}`}
              className="block text-mint text-[11px] font-medium hover:underline"
            >
              {t("tooltips.learnMore")}
            </Link>
          )}
        </div>
      }
    >
      <button
        type="button"
        aria-label={t("tooltips.helpLabel")}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center text-mist hover:text-fog transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}
