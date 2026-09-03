import React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function MobileHeader({ title, showBackButton, onBack }) {
  const { logout } = useAuth();
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-line bg-surface/95 shadow-sm backdrop-blur lg:hidden">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
        {showBackButton && (
          <button onClick={onBack} className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl text-ink/70 transition hover:bg-surface-2 hover:text-primary" aria-label="Retour">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate font-display text-lg text-ink">{title}</h1>
        <button
          type="button"
          onClick={logout}
          aria-label="Se deconnecter"
          title="Se deconnecter"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100 hover:text-red-700 active:scale-95"
        >
          <FaSignOutAlt size={15} />
        </button>
      </div>
    </header>
  );
}
