import React from "react";

export default function Textarea({ id, className = "", rows = 4, ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={`w-full rounded-lg border-2 border-line bg-transparent px-3 py-2 text-ink transition focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none ${className}`}
      {...props}
    />
  );
}
