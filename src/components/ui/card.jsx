import React from "react";

export default function Card({
  children,
  className = "",
  elevated = true,
  border = true,
  rounded = "md",
  padding = true,
  variant = "default", // "default" ou "outlined"
  ...props
}) {
  const roundedClass = { none: "", sm: "rounded-lg", md: "rounded-xl", lg: "rounded-2xl", full: "rounded-3xl" }[rounded] || "rounded-xl";

  const baseClasses = `${roundedClass} ${padding ? "p-4 md:p-6" : ""} transition-colors duration-200`;

  const variantClasses = {
    default: `${elevated ? "shadow-sm" : ""} ${border ? "border border-line" : ""} bg-surface text-ink`,
    outlined: "border-2 border-primary/20 bg-transparent text-ink",
  }[variant];

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
