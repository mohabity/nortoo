"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { PAGE_SIZE_OPTIONS } from "@/hooks/use-orders-page";
import type { OrdersMeta } from "@/types/orders";

interface OrdersPaginationProps {
  meta: OrdersMeta;
  perPage: number;
  cursorMode: boolean;
  nextCursor: string | undefined;
  prevCursor: string | undefined;
  onFilterChange: (key: string, value: string) => void;
  onPerPageChange: (size: number) => void;
  onNextCursor: () => void;
  onPrevCursor: () => void;
}

export function OrdersPagination({
  meta,
  perPage,
  cursorMode,
  nextCursor,
  prevCursor,
  onFilterChange,
  onPerPageChange,
  onNextCursor,
  onPrevCursor,
}: OrdersPaginationProps) {
  const { t } = useTranslation();

  if (meta.total <= 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: info + page size selector */}
      <div className="flex items-center gap-3 text-sm text-fog">
        {!cursorMode && (
          <>
            <span className="hidden sm:inline">
              {t("orders.pagination.showing", {
                from: Math.min((meta.page - 1) * perPage + 1, meta.total),
                to: Math.min(meta.page * perPage, meta.total),
                total: meta.total,
              })}
            </span>
            <span className="sm:hidden">
              {meta.page}/{meta.totalPages}
            </span>
          </>
        )}
        {cursorMode && (
          <span>
            {meta.total.toLocaleString()} {t("orders.pagination.totalOrders")}
          </span>
        )}
        <span className="text-silk hidden sm:inline">|</span>
        <div className="flex items-center gap-1.5">
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="h-8 rounded-md border border-silk bg-white px-2 text-sm text-slate focus:outline-none focus:ring-2 focus:ring-mint/30 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-fog text-sm">{t("orders.pagination.perPage")}</span>
        </div>
      </div>

      {/* Right: page-based navigation */}
      {!cursorMode && meta.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onFilterChange("page", "1")}
            className="hidden sm:flex h-8 w-8 p-0"
            aria-label={t("orders.pagination.first")}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onFilterChange("page", String(meta.page - 1))}
            className="h-8 w-8 p-0"
            aria-label={t("orders.pagination.previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers — hidden on mobile */}
          {(() => {
            const pages: (number | "...")[] = [];
            const total = meta.totalPages;
            const current = meta.page;

            if (total <= 7) {
              for (let i = 1; i <= total; i++) pages.push(i);
            } else {
              pages.push(1);
              if (current > 3) pages.push("...");
              const start = Math.max(2, current - 1);
              const end = Math.min(total - 1, current + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (current < total - 2) pages.push("...");
              pages.push(total);
            }

            return (
              <span className="hidden sm:contents">
                {pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-1 text-mist text-sm">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === current ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFilterChange("page", String(p))}
                      className={cn(
                        "h-8 w-8 p-0 text-sm",
                        p === current && "bg-midnight text-white hover:bg-midnight/90"
                      )}
                    >
                      {p}
                    </Button>
                  )
                )}
              </span>
            );
          })()}

          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onFilterChange("page", String(meta.page + 1))}
            className="h-8 w-8 p-0"
            aria-label={t("orders.pagination.next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onFilterChange("page", String(meta.totalPages))}
            className="hidden sm:flex h-8 w-8 p-0"
            aria-label={t("orders.pagination.last")}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right: cursor-based navigation */}
      {cursorMode && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevCursor}
            onClick={onPrevCursor}
            className="h-8 px-3"
            aria-label={t("orders.pagination.previous")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("orders.pagination.prev")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!nextCursor || meta.hasMore === false}
            onClick={onNextCursor}
            className="h-8 px-3"
            aria-label={t("orders.pagination.next")}
          >
            {t("orders.pagination.next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
