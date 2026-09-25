import React from "react";
import { FaTimes } from "react-icons/fa";
import Button from "../ui/Button";

export default function Dialog({ open, onClose, title, children, className = "" }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex min-h-0 items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || undefined}
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 cursor-default bg-ink/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        className={[
          "relative z-10 flex min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl",
          "max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)]",
          className,
        ].join(" ")}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3.5 sm:px-6 sm:py-4">
            <h3 className="min-w-0 truncate font-display text-lg font-semibold text-ink sm:text-xl">
              {title}
            </h3>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <FaTimes size={16} />
            </Button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
