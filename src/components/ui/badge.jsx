import React from "react";

export default function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-surface-2 text-ink/70",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    accent: "bg-accent/10 text-accent",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
