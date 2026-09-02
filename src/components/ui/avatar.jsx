import React from "react";

export default function Avatar({ src, alt = "avatar", className = "" }) {
  return (
    <div className={`rounded-full overflow-hidden inline-flex items-center justify-center bg-primary text-white font-semibold w-10 h-10 ${className}`}>
      {src ? <img src={src} alt={alt} className="object-cover w-full h-full" /> : <span>{alt?.[0]?.toUpperCase() || "U"}</span>}
    </div>
  );
}
