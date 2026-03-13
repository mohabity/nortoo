"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  maxWidth?: number;
}

export function Tooltip({
  content,
  children,
  side = "top",
  maxWidth = 250,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const tr = trigger.getBoundingClientRect();
    const tt = tooltip.getBoundingClientRect();
    const pad = 8;
    let x = 0;
    let y = 0;

    switch (side) {
      case "top":
        x = tr.left + tr.width / 2 - tt.width / 2;
        y = tr.top - tt.height - pad;
        break;
      case "bottom":
        x = tr.left + tr.width / 2 - tt.width / 2;
        y = tr.bottom + pad;
        break;
      case "left":
        x = tr.left - tt.width - pad;
        y = tr.top + tr.height / 2 - tt.height / 2;
        break;
      case "right":
        x = tr.right + pad;
        y = tr.top + tr.height / 2 - tt.height / 2;
        break;
    }

    // Clamp to viewport
    x = Math.max(8, Math.min(x, window.innerWidth - tt.width - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - tt.height - 8));

    setCoords({ x, y });
  }, [side]);

  useEffect(() => {
    if (open) {
      // Delay to let portal render before measuring
      requestAnimationFrame(computePosition);
    }
  }, [open, computePosition]);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  };

  const hide = () => {
    hideTimer.current = setTimeout(() => setOpen(false), 100);
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const arrowSide = {
    top: "bottom-[-5px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-midnight",
    bottom: "top-[-5px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-midnight",
    left: "right-[-5px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-midnight",
    right: "left-[-5px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-midnight",
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={toggle}
        className="inline-flex"
      >
        {children}
      </span>
      {mounted &&
        open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            onMouseEnter={show}
            onMouseLeave={hide}
            className={cn(
              "fixed z-50 rounded-md bg-midnight px-3 py-2 text-xs text-white shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-150"
            )}
            style={{
              left: coords.x,
              top: coords.y,
              maxWidth,
            }}
          >
            {content}
            <span
              className={cn(
                "absolute border-[5px] border-solid",
                arrowSide[side]
              )}
            />
          </div>,
          document.body
        )}
    </>
  );
}
