"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

/**
 * Built on the native <dialog>: focus is trapped, Esc closes, and the page behind is inert.
 * Full-screen on phones. Children only mount while open, so each open starts with fresh state.
 */
export function Modal({ open, onClose, title, subtitle, size = "md", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop
      }}
      className={cn(
        "m-auto w-full overflow-hidden rounded-2xl border border-line2 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        SIZES[size],
        "max-sm:fixed max-sm:inset-0 max-sm:m-0 max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:border-0",
      )}
    >
      {open && (
        <div className="flex max-h-[90dvh] flex-col max-sm:h-dvh max-sm:max-h-none">
          <div className="flex shrink-0 items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              {title && <h2 className="font-display text-2xl leading-tight">{title}</h2>}
              {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition hover:border-line2 hover:text-text"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </div>
      )}
    </dialog>
  );
}
