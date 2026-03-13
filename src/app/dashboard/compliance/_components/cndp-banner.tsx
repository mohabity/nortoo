"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/i18n/provider";

interface CndpBannerProps {
  cndpRef: string | null;
}

export function CndpBanner({ cndpRef }: CndpBannerProps) {
  const { t } = useTranslation();

  if (!cndpRef) {
    return (
      <div className="flex items-center gap-3 rounded border border-amber/30 bg-amber/5 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-midnight">{t("compliance.cndp.required")}</p>
          <p className="text-xs text-fog">{t("compliance.cndp.requiredDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded border border-mint/30 bg-mint/5 px-4 py-3">
      <CheckCircle2 className="h-4 w-4 text-mint-deep shrink-0" />
      <p className="text-sm text-midnight">
        <span className="font-medium">{t("compliance.cndp.ref")}</span>{" "}
        <span className="font-mono text-mint-deep">{cndpRef}</span>
      </p>
    </div>
  );
}
