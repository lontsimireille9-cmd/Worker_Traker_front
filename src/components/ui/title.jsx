import React from "react";
import clsx from "clsx";

/**
 * Title – titres centralisés avec la police display du projet.
 */
export default function Title({ as = "h2", variant = "section", tone = "main", centered = false, className, children }) {
  const Component = as;
  const base = "font-display tracking-tight";

  const tones = {
    main: "text-ink",
    muted: "text-muted",
    accent: "text-accent",
  };

  const variants = {
    page: "text-3xl",
    section: "text-2xl",
    card: "text-lg",
  };

  return (
    <Component className={clsx(base, variants[variant], tones[tone], centered && "text-center", className)}>
      {children}
    </Component>
  );
}
