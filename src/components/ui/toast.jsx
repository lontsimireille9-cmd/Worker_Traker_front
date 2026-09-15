import React, { useEffect, useState } from "react";

export default function Toast({ type = "info", message, children, className = "", duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
  };

  const icons = { info: "💡", success: "✅", warning: "⚠️", danger: "❌" };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg text-sm shadow-lg transition-all duration-300 z-50 max-w-sm ${styles[type]} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icons[type]}</span>
        <div className="flex-1">{message ? <p>{message}</p> : children}</div>
        <button onClick={() => setIsVisible(false)} className="flex-shrink-0 text-current/50 hover:text-current">
          ✕
        </button>
      </div>
    </div>
  );
}
