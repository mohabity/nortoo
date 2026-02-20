"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSelectionReturn {
  selectedIds: Set<number>;
  isSelected: (id: number) => boolean;
  toggle: (id: number) => void;
  toggleAll: () => void;
  rangeSelect: (id: number) => void;
  clearSelection: () => void;
  selectAllState: "none" | "some" | "all";
  selectionCount: number;
  isSelectionMode: boolean;
}

export function useSelection(
  items: { id: number }[],
  maxSelection = 50
): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const lastToggledRef = useRef<number | null>(null);
  const prevItemsRef = useRef(items);

  // Clear selection when items change (filter/page navigation)
  useEffect(() => {
    if (prevItemsRef.current !== items) {
      prevItemsRef.current = items;
      setSelectedIds((prev) => {
        if (prev.size === 0) return prev;
        // Prune: keep only IDs still in the new items
        const validIds = new Set(items.map((i) => i.id));
        const pruned = new Set<number>();
        for (const id of prev) {
          if (validIds.has(id)) pruned.add(id);
        }
        return pruned.size === prev.size ? prev : pruned;
      });
    }
  }, [items]);

  const isSelected = useCallback(
    (id: number) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback(
    (id: number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < maxSelection) {
          next.add(id);
        }
        return next;
      });
      lastToggledRef.current = id;
    },
    [maxSelection]
  );

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size > 0) {
        return new Set<number>();
      }
      const ids = items.slice(0, maxSelection).map((i) => i.id);
      return new Set(ids);
    });
  }, [items, maxSelection]);

  const rangeSelect = useCallback(
    (id: number) => {
      if (lastToggledRef.current === null) {
        // No previous toggle — just toggle this one
        toggle(id);
        return;
      }

      const lastIdx = items.findIndex(
        (i) => i.id === lastToggledRef.current
      );
      const currIdx = items.findIndex((i) => i.id === id);

      if (lastIdx === -1 || currIdx === -1) {
        toggle(id);
        return;
      }

      const start = Math.min(lastIdx, currIdx);
      const end = Math.max(lastIdx, currIdx);
      const rangeIds = items.slice(start, end + 1).map((i) => i.id);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const rid of rangeIds) {
          if (next.size < maxSelection) {
            next.add(rid);
          }
        }
        return next;
      });
    },
    [items, maxSelection, toggle]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastToggledRef.current = null;
  }, []);

  const selectionCount = selectedIds.size;
  const isSelectionMode = selectionCount > 0;

  let selectAllState: "none" | "some" | "all" = "none";
  if (selectionCount > 0 && items.length > 0) {
    const allVisible = items.every((i) => selectedIds.has(i.id));
    selectAllState = allVisible ? "all" : "some";
  }

  return {
    selectedIds,
    isSelected,
    toggle,
    toggleAll,
    rangeSelect,
    clearSelection,
    selectAllState,
    selectionCount,
    isSelectionMode,
  };
}
