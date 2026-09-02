import React from "react";

export default function Label({ htmlFor, children, className = "", required = false, variant = "default" }) {
  const variants = {
    default: "block text-sm font-medium mb-1.5",
    inline: "inline-block text-sm font-medium mr-3",
    small: "block text-xs font-medium mb-1",
  };

  return (
    <label
      htmlFor={htmlFor}
      className={`${variants[variant]} text-ink/70 transition-colors duration-200 ${
        required ? "after:content-['*'] after:ml-1 after:text-red-500" : ""
      } ${className}`}
    >
      {children}
    </label>
  );
}
