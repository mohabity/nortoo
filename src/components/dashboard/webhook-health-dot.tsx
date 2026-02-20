"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HealthStatus = "ok" | "warning" | "critical" | "loading";

export function WebhookHealthDot() {
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch("/api/settings/diagnostics");
        if (!res.ok) return;
        const json = await res.json();
        const d = json.data;
        if (!mounted) return;

        if (!d.storeConnected) {
          setStatus("critical");
          return;
        }

        const lastWebhook = d.lastRealWebhookAt;
        if (!lastWebhook) {
          setStatus("critical");
          return;
        }

        const hoursAgo = (Date.now() - new Date(lastWebhook).getTime()) / 3_600_000;
        if (hoursAgo > 72) setStatus("critical");
        else if (hoursAgo > 24) setStatus("warning");
        else setStatus("ok");
      } catch {
        // silently fail — dot stays loading/hidden
      }
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status === "loading") return null;

  const colors: Record<HealthStatus, string> = {
    ok: "bg-mint",
    warning: "bg-amber-400",
    critical: "bg-rose",
    loading: "bg-mist",
  };

  const labels: Record<HealthStatus, string> = {
    ok: "Webhook actif",
    warning: "Webhook inactif depuis +24h",
    critical: "Webhook inactif depuis +72h",
    loading: "",
  };

  return (
    <Link
      href="/dashboard/settings?tab=store"
      title={labels[status]}
      className="relative flex h-8 w-8 items-center justify-center rounded-sm hover:bg-snow transition-colors"
    >
      <span className={`h-2 w-2 rounded-full ${colors[status]}`} />
      {status !== "ok" && (
        <span
          className={`absolute h-2 w-2 rounded-full ${colors[status]} animate-ping`}
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        />
      )}
    </Link>
  );
}
