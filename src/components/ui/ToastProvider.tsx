"use client";

/**
 * ToastProvider + useToast (design Section 3).
 *
 * Lightweight context-based toast queue. Friendly, emoji-free copy supplied by
 * callers (sourced from copy.ts). Toasts auto-dismiss and animate with motion.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Toast, type ToastTone } from "@/components/ui/Toast";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 2600;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), DEFAULT_DURATION);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-20 z-[60] mx-auto flex w-full max-w-[480px] flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} tone={t.tone} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
