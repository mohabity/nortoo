"use client";

import { ScoreBadge } from "../score-badge";
import { translateExplanation } from "@/lib/translate-explanation";
import type { ScoringFactor } from "@/types/orders";
import type { Locale } from "@/i18n/types";

// ── Props ──

interface ScoringDetailsProps {
  scoringFactors: ScoringFactor[];
  fraudScore: number;
  decision: string;
  confidence: number;
  scoringVersion: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
}

// ── Component ──

export function ScoringDetails({
  scoringFactors,
  fraudScore,
  decision,
  confidence,
  scoringVersion,
  t,
}: ScoringDetailsProps) {
  // ── Explanation Card color ──
  const colorClass =
    fraudScore <= 30
      ? "bg-mint-light/50 border-mint/20"
      : fraudScore <= 65
      ? "bg-sun-light/50 border-sun/20"
      : fraudScore <= 85
      ? "bg-coral-light/50 border-coral/20"
      : "bg-violet-light/50 border-violet/20";

  if (scoringFactors.length === 0) {
    return (
      <div className="mx-6 mt-4 rounded-lg border border-silk bg-snow p-3">
        <p className="text-xs text-mist italic">
          {t("components.orderSlideOver.noAnalysis")}
        </p>
      </div>
    );
  }

  const expl = translateExplanation(
    fraudScore,
    decision,
    scoringFactors,
    confidence,
    t,
  );

  return (
    <>
      {/* ── Scoring Factors Table ── */}
      <div className="mx-6 mt-4">
        <h3 className="text-sm font-semibold text-midnight font-display mb-2">
          {t("components.orderSlideOver.scoringAnalysis")}
        </h3>
        <div className="rounded-lg border border-silk overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-snow/50">
                <th className="px-3 py-2 text-left font-medium text-fog text-xs">{t("components.orderSlideOver.rule")}</th>
                <th className="px-3 py-2 text-center font-medium text-fog text-xs w-[60px]">{t("components.orderSlideOver.points")}</th>
                <th className="px-3 py-2 text-left font-medium text-fog text-xs">{t("components.orderSlideOver.reason")}</th>
              </tr>
            </thead>
            <tbody>
              {scoringFactors.map((factor) => (
                <tr key={factor.rule} className="border-t border-silk">
                  <td className="px-3 py-2 font-mono text-xs text-slate">
                    {factor.rule}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={
                        factor.points > 0
                          ? "font-mono font-bold text-rose text-xs"
                          : factor.points < 0
                          ? "font-mono font-bold text-mint-deep text-xs"
                          : "font-mono text-mist text-xs"
                      }
                    >
                      {factor.points > 0
                        ? `+${factor.points}`
                        : factor.points === 0
                        ? "—"
                        : factor.points}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-fog">
                    {(() => {
                      const translated = t(`scoring.rules.${factor.rule}`);
                      return translated.startsWith("scoring.rules.") ? factor.reason : translated;
                    })()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-silk bg-snow">
                <td className="px-3 py-2 font-mono font-bold text-midnight text-xs">{t("components.orderSlideOver.total")}</td>
                <td className="px-3 py-2 text-center">
                  <ScoreBadge score={fraudScore} size="sm" />
                </td>
                <td className="px-3 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-mist mt-1.5">
          {scoringVersion ?? "v1.0"} — {t("components.orderSlideOver.confidence", { value: Math.round(confidence * 100) })}
        </p>
      </div>

      {/* ── Explanation Card ── */}
      <div className={`mx-6 mt-4 rounded-lg border p-4 ${colorClass}`}>
        <p className="text-sm font-medium text-midnight">
          {expl.summary}
        </p>
        <ul className="mt-2 space-y-1">
          {expl.factors.map((f: string, i: number) => (
            <li key={i} className="text-xs text-slate">
              {f}
            </li>
          ))}
        </ul>
        {expl.tip && (
          <p className="mt-2 text-xs font-medium text-fog italic">
            {expl.tip}
          </p>
        )}
        <p className="mt-1.5 text-[10px] text-mist">
          {t("components.orderSlideOver.confidence", { value: expl.confidenceLabel })}
        </p>
      </div>
    </>
  );
}
