"use client";

import { cn } from "@/lib/utils";

interface ThresholdBarProps {
  verify: number;
  flag: number;
  block: number;
}

export function ThresholdBar({ verify, flag, block }: ThresholdBarProps) {
  return (
    <div className="space-y-2">
      <div className="relative h-8 rounded-xs overflow-hidden flex">
        {/* Ship zone */}
        <div
          className="bg-mint/20 flex items-center justify-center text-xs font-medium text-mint-deep"
          style={{ width: `${verify}%` }}
        >
          Expédier
        </div>
        {/* Verify zone */}
        <div
          className="bg-amber-bg flex items-center justify-center text-xs font-medium text-amber"
          style={{ width: `${flag - verify}%` }}
        >
          Vérifier
        </div>
        {/* Flag zone */}
        <div
          className="bg-rose-bg flex items-center justify-center text-xs font-medium text-rose"
          style={{ width: `${block - flag}%` }}
        >
          Signaler
        </div>
        {/* Block zone */}
        <div
          className="bg-violet-bg flex items-center justify-center text-xs font-medium text-violet"
          style={{ width: `${100 - block}%` }}
        >
          Bloquer
        </div>
      </div>
      {/* Threshold markers */}
      <div className="relative h-4 text-[10px] font-mono text-fog">
        <span className="absolute left-0">0</span>
        <span className="absolute" style={{ left: `${verify}%`, transform: "translateX(-50%)" }}>{verify}</span>
        <span className="absolute" style={{ left: `${flag}%`, transform: "translateX(-50%)" }}>{flag}</span>
        <span className="absolute" style={{ left: `${block}%`, transform: "translateX(-50%)" }}>{block}</span>
        <span className="absolute right-0">100</span>
      </div>
    </div>
  );
}
