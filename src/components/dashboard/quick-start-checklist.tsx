"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Square,
  X,
  Rocket,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OnboardingData {
  completed: boolean;
  storeConnected: boolean;
  scoringConfigured: boolean;
  testOrderSent: boolean;
  realOrderCount: number;
}

interface CheckItem {
  label: string;
  done: boolean;
  pending?: string;
}

export function QuickStartChecklist() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check sessionStorage for dismissal
    if (typeof window !== "undefined" && sessionStorage.getItem("quickstart_dismissed")) {
      setDismissed(true);
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) return;
        const json = await res.json();
        setData(json.data);
      } catch {
        // silently fail
      }
    }
    load();
  }, []);

  if (dismissed || !data) return null;

  // Only show for onboarded merchants with < 10 real orders
  if (!data.completed || data.realOrderCount >= 10) return null;

  const items: CheckItem[] = [
    { label: "Boutique connect\u00E9e", done: data.storeConnected },
    { label: "Scoring configur\u00E9", done: data.scoringConfigured },
    { label: "Commande test envoy\u00E9e", done: data.testOrderSent },
    {
      label: "Recevoir votre premi\u00E8re vraie commande",
      done: data.realOrderCount > 0,
      pending:
        "En attente... Les commandes COD seront scor\u00E9es automatiquement d\u00E8s qu\u2019un client passe commande.",
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  // If all done, auto-dismiss after 3 seconds
  if (allDone && !fadeOut) {
    setTimeout(() => setFadeOut(true), 2000);
    setTimeout(() => setDismissed(true), 2500);
  }

  function handleDismiss() {
    sessionStorage.setItem("quickstart_dismissed", "1");
    setFadeOut(true);
    setTimeout(() => setDismissed(true), 300);
  }

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        fadeOut && "opacity-0 scale-95"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-mint-deep" />
            <CardTitle className="text-sm">D\u00E9marrage rapide</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-mint-bg text-mint-deep px-2 py-0.5 rounded-full">
              {completedCount}/{items.length} compl\u00E9t\u00E9
            </span>
            <button
              onClick={handleDismiss}
              className="text-mist hover:text-fog transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-mint-deep shrink-0 mt-0.5" />
            ) : (
              <Square className="h-4 w-4 text-mist shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={cn(
                  "text-sm",
                  item.done ? "text-slate" : "text-fog"
                )}
              >
                {item.label}
              </p>
              {!item.done && item.pending && (
                <p className="text-xs text-mist mt-0.5">{item.pending}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
