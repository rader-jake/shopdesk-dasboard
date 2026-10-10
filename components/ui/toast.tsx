"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastKind = "ok" | "error";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, kind: ToastKind = "ok") => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* top layer so toasts also show above open modals */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-24 left-1/2 z-[2000] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col items-center gap-2 md:bottom-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-fade-up pointer-events-auto w-full rounded-xl border border-l-4 border-line2 bg-surface2 px-4 py-3 text-sm shadow-2xl",
              t.kind === "error" ? "border-l-danger" : "border-l-accent",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
