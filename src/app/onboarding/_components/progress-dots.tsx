"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

export const STEP_COUNT = 5;

export function ProgressDots({ currentStep }: { currentStep: number }) {
  const { t } = useTranslation();

  return (
    <>
      {/* Progress dots */}
      <div className="mb-6 flex items-center justify-center">
        {Array.from({ length: STEP_COUNT }, (_, i) => {
          const s = i + 1;
          const isCompleted = s < currentStep;
          const isActive = s === currentStep;
          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div
                  className={cn(
                    "h-0.5 w-8 sm:w-12 transition-colors duration-300",
                    isCompleted || isActive ? "bg-mint" : "bg-silk"
                  )}
                />
              )}
              <div
                className={cn(
                  "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full transition-all duration-300 shrink-0",
                  isCompleted && "bg-mint",
                  isActive && "bg-white border-2 border-mint shadow-[0_0_8px_rgba(52,211,153,0.5)]",
                  !isCompleted && !isActive && "bg-white border-2 border-silk"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Step counter */}
      <p className="mb-4 text-center font-mono text-[0.55rem] text-mist uppercase tracking-wider">
        {t("onboarding.stepCounter").replace("{step}", String(currentStep)).replace("{total}", String(STEP_COUNT))}
      </p>
    </>
  );
}
