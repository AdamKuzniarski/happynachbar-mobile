"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  title,
  className,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-24 w-[92%] max-w-xl">
        <div
          className={cn(
            "rounded-md border-2 border-fern bg-surface p-4 shadow-lg",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              className="rounded-md border-2 border-fern bg-surface-strong px-2 py-1 text-sm font-medium"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="mt-4">{children}</div>

          {footer ? (
            <div className="mt-4 flex justify-end gap-2">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
