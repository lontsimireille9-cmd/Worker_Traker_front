import React from "react";
import { FaTimes } from "react-icons/fa";

export default function Dialog({ open, onClose, title, children, className = "" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center px-4">
      <div className="absolute inset-0 backdrop-blur-sm bg-ink/30" onClick={onClose} />
      <div className={`relative bg-surface rounded-xl py-8 px-6 shadow-lg max-w-lg w-full z-10 ${className}`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-ink">{title}</h3>
            <button onClick={onClose} className="text-muted hover:text-ink transition">
              <FaTimes size={18} />
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
