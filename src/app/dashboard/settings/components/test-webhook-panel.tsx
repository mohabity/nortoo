"use client";

import { useState } from "react";
import {
  Zap,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, decisionLabel } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { formatCurrency } from "@/lib/i18n-utils";

// ── Types ──

interface TestResult {
  orderId: number;
  score: number;
  decision: string;
  riskLevel: string;
  factors: Array<{ rule: string; points: number; reason: string }>;
  confidence: number;
  isTest: boolean;
  testOrder: {
    ref: string;
    customer: string;
    city: string;
    product: string;
    total: number;
  };
  durationMs: number;
}

const DECISION_COLORS: Record<string, string> = {
  ship: "text-mint-deep bg-mint-bg",
  verify: "text-sun-deep bg-sun-bg",
  flag: "text-coral bg-coral-bg",
  block: "text-violet bg-violet-bg",
};

// ── Component ──

export function TestWebhookPanel() {
  const { t, locale } = useTranslation();
  const [testState, setTestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  async function handleTestWebhook() {
    setTestState("loading");
    setTestResult(null);
    setTestError(null);

    try {
      const res = await fetch("/api/webhook/test", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setTestState("error");
        setTestError(json.error || t("settings.store.testFailed"));
        return;
      }

      setTestResult(json.data);
      setTestState("success");

      // Auto-reset after 10 seconds
      setTimeout(() => {
        setTestState("idle");
        setTestResult(null);
      }, 10_000);
    } catch {
      setTestState("error");
      setTestError(t("settings.store.networkError"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-sun" />
          <div>
            <CardTitle className="text-base">{t("settings.store.test")}</CardTitle>
            <CardDescription>
              {t("settings.store.testSubtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test button */}
        {testState === "idle" && (
          <Button onClick={handleTestWebhook} className="w-full sm:w-auto">
            <Play className="mr-2 h-4 w-4" />
            {t("settings.store.sendTest")}
          </Button>
        )}

        {/* Loading state */}
        {testState === "loading" && (
          <div className="flex items-center gap-3 rounded-sm border border-silk bg-snow px-4 py-3">
            <Loader2 className="h-5 w-5 animate-spin text-ocean" />
            <div>
              <p className="text-sm font-medium text-midnight">{t("settings.store.sending")}</p>
              <p className="text-xs text-fog">{t("settings.store.testScoring")}</p>
            </div>
          </div>
        )}

        {/* Success result */}
        {testState === "success" && testResult && (
          <div className="rounded-sm border border-mint bg-mint-bg/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-mint-deep" />
              <p className="text-sm font-semibold text-mint-deep">
                {t("settings.store.testSuccess", { ms: testResult.durationMs })}
              </p>
            </div>

            <div className="rounded-sm border border-silk bg-white divide-y divide-silk">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.reference")}</span>
                <span className="text-xs font-mono font-medium text-midnight">
                  {testResult.testOrder.ref}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.score")}</span>
                <span className="text-xs font-mono font-bold text-midnight">
                  {testResult.score}/100
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.decision")}</span>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded",
                  DECISION_COLORS[testResult.decision] || "text-slate bg-snow"
                )}>
                  {decisionLabel(testResult.decision, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.client")}</span>
                <span className="text-xs text-slate">{testResult.testOrder.customer}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.city")}</span>
                <span className="text-xs text-slate">{testResult.testOrder.city}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.product")}</span>
                <span className="text-xs text-slate">{testResult.testOrder.product}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.amount")}</span>
                <span className="text-xs font-mono text-slate">
                  {formatCurrency(testResult.testOrder.total, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-fog">{t("settings.store.confidence")}</span>
                <span className="text-xs text-slate">
                  {Math.round(testResult.confidence * 100)}%
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestWebhook}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              {t("settings.store.retryTest")}
            </Button>
          </div>
        )}

        {/* Error state */}
        {testState === "error" && (
          <div className="rounded-sm border border-rose bg-rose-bg/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose" />
              <p className="text-sm font-semibold text-rose">{t("settings.store.testFailed")}</p>
            </div>
            <p className="text-sm text-fog">{testError}</p>
            <div className="text-xs text-fog space-y-1">
              <p>{t("settings.store.suggestions")}</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>{t("settings.store.checkApiKey")}</li>
                <li>{t("settings.store.checkConnection")}</li>
                <li>{t("settings.store.testLimit")}</li>
              </ul>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestWebhook}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              {t("common.retry")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
