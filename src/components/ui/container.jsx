import React from "react";

export default function Container({ children, className = "", fullWidth = false, fullHeight = false, noPadding = false }) {
  return (
    <div
      className={`${fullHeight ? "min-h-screen" : ""} ${fullWidth ? "w-full" : "max-w-4xl mx-auto"} ${
        noPadding ? "" : "px-4 md:px-6 lg:px-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}
