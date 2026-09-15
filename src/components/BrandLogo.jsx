import React from "react";

export default function BrandLogo({ className = "", compact = false, alt = "Suivi Employés" }) {
  return (
    <img
      src={compact ? "/suivi-employes-mark.png" : "/suivi-employes-logo.png"}
      alt={alt}
      className={`block object-contain ${compact ? "h-10 w-10" : "h-auto w-full"} ${className}`}
    />
  );
}
