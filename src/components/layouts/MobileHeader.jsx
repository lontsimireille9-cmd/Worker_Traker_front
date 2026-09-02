import React from "react";

export default function MobileHeader({ title, showBackButton, onBack }) {
  return (
    <header className="md:hidden bg-surface border-b border-line fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center px-4 h-14">
        {showBackButton && (
          <button onClick={onBack} className="mr-2 text-ink/70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="font-display text-lg text-ink">{title}</h1>
      </div>
    </header>
  );
}
