import React from "react";

export default function Select({ id, options = [], className = "", children, ...props }) {
  return (
    <select
      id={id}
      className={`w-full rounded-lg border-2 border-line bg-transparent px-3 py-2.5 pr-8 text-ink transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none ${className}`}
      {...props}
    >
      {children ||
        options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
    </select>
  );
}
