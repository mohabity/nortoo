"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

// ── Context ──

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Toast Item ──

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const ms = toast.duration ?? (toast.action ? 8000 : 4000);
    const timer = setTimeout(() => onDismiss(toast.id), ms);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, toast.action, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg animate-in slide-in-from-right-5",
        toast.type === "success" && "border-l-4 border-l-mint",
        toast.type === "error" && "border-l-4 border-l-rose",
        toast.type === "info" && "border-l-4 border-l-ocean"
      )}
    >
      <p className="text-sm text-slate flex-1">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
          className="text-sm font-medium text-ocean hover:underline shrink-0"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-mist hover:text-slate shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Provider ──

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:right-6 lg:left-auto z-[60] space-y-2 lg:w-[380px]">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
