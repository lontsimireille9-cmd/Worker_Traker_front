import React from "react";

export default function MobileHeader({ title, showBackButton, onBack }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-line bg-surface/95 shadow-sm backdrop-blur lg:hidden">
      <div className="flex h-14 items-center px-4 sm:px-6">
        {showBackButton && (
          <button onClick={onBack} className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl text-ink/70 transition hover:bg-surface-2 hover:text-primary" aria-label="Retour">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="truncate font-display text-lg text-ink">{title}</h1>
      </div>
    </header>
  );
}
