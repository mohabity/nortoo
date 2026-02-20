"use client";

import { X, AlertTriangle } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  maxExceeded: boolean;
  onForceShip: () => void;
  onForceBlock: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  maxExceeded,
  onForceShip,
  onForceBlock,
  onClear,
}: BulkActionBarProps) {
  return (
    <div
      className="fixed bottom-16 left-0 right-0 lg:bottom-0 lg:left-64 z-40 animate-in slide-in-from-bottom-4 duration-200"
      role="toolbar"
      aria-label="Actions groupées"
    >
      <div
        className="bg-[#0B0F1A] text-white rounded-t-[14px] px-4 py-3 lg:px-6 lg:py-3"
        style={{ boxShadow: "0 -8px 30px rgba(11,15,26,.15)" }}
      >
        {/* Desktop layout */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Annuler la sélection"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="text-[0.85rem] font-semibold">
              {selectedCount} commande{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
            </span>
            {maxExceeded && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Max 50 commandes par action
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onForceShip}
              disabled={maxExceeded}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-mint px-4 py-2 text-sm font-semibold text-[#0B0F1A] transition-colors hover:bg-mint-deep disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forcer expédition
            </button>
            <button
              onClick={onForceBlock}
              disabled={maxExceeded}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-rose px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forcer blocage
            </button>
            <button
              onClick={onClear}
              className="px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.85rem] font-semibold">
              {selectedCount} commande{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
            </span>
            <button
              onClick={onClear}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Annuler la sélection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {maxExceeded && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Max 50 commandes par action
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={onForceShip}
              disabled={maxExceeded}
              className="flex-1 rounded-[10px] bg-mint py-2.5 text-sm font-semibold text-[#0B0F1A] transition-colors hover:bg-mint-deep disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forcer expédition
            </button>
            <button
              onClick={onForceBlock}
              disabled={maxExceeded}
              className="flex-1 rounded-[10px] bg-rose py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forcer blocage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
