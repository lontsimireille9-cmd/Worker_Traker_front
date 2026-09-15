import React from "react";

export default function Spinner({ size = "md", className = "", fullPage = false, text = "" }) {
  const sizeClasses = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-[3px]", lg: "w-12 h-12 border-4" };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-t-primary border-line ${sizeClasses[size]}`} />
      {text && <p className="mt-3 text-sm text-muted">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
