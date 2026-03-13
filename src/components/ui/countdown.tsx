"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/provider";

interface CountdownProps {
  deadline: string;
  className?: string;
}

/**
 * Reusable countdown timer that displays time remaining until a deadline.
 * Shows "Xh00" for hours, "Xmin" for minutes, or "expired" when past.
 */
export function Countdown({ deadline, className }: CountdownProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setLabel(t("time.expired"));
        setOverdue(true);
        return;
      }
      setOverdue(false);
      const mins = Math.floor(diff / 60000);
      setLabel(
        mins >= 60
          ? `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, "0")}`
          : `${mins}min`
      );
    }
    update();
    const iv = setInterval(update, 30000);
    return () => clearInterval(iv);
  }, [deadline, t]);

  return (
    <span
      className={className ?? `text-[10px] font-mono font-medium ${overdue ? "text-rose" : "text-amber"}`}
    >
      {label}
    </span>
  );
}
