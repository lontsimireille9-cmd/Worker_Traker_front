import React from "react";

export default function Alert({ type = "info", children, className = "" }) {
  const styles = {
    info: "bg-blue-50 text-blue-700 border border-blue-100",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-800 border border-amber-100",
    danger: "bg-red-50 text-red-700 border border-red-100",
  };

  return <div className={`p-3 rounded-lg text-sm ${styles[type]} ${className}`}>{children}</div>;
}
