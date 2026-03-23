import React from "react";

interface SharkLogoProps {
  /** Height class applied to the wrapper (e.g. "h-8", "h-12", "h-14") */
  className?: string;
  /** Show just the shark icon — no wordmark */
  iconOnly?: boolean;
}

/**
 * SharkTech Global brand mark.
 * The shark silhouette faithfully reproduces the angular geometric style
 * of the official SharkTech Global logo (gold on dark).
 * Wordmark: "SHARKVIEW" + "by SharkTech Global".
 */
export const SharkLogo: React.FC<SharkLogoProps> = ({
  className = "h-8",
  iconOnly = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ── Shark mark ── */}
      <svg
        viewBox="0 0 90 60"
        fill="none"
        className="h-full w-auto"
        aria-hidden="true"
      >
        <defs>
          {/* Main gold gradient */}
          <linearGradient id="stg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFE8A0" />
            <stop offset="30%"  stopColor="#F0C040" />
            <stop offset="60%"  stopColor="#C8920A" />
            <stop offset="100%" stopColor="#906200" />
          </linearGradient>
          {/* Highlight gradient (lighter top) */}
          <linearGradient id="stg-hi" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#FFE8A0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D4A017" stopOpacity="0.4" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="stg-glow" x="-15%" y="-25%" width="130%" height="150%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Subtle drop shadow */}
          <filter id="stg-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* ── Dorsal fins (3 triangular fins above body) ── */}
        {/* Fin 1 — main dorsal, tallest */}
        <polygon
          points="24,28 30,8 36,28"
          fill="url(#stg-gold)"
          filter="url(#stg-glow)"
        />
        {/* Fin 2 — mid dorsal */}
        <polygon
          points="38,28 43,14 48,28"
          fill="url(#stg-gold)"
          opacity="0.88"
        />
        {/* Fin 3 — rear dorsal nub */}
        <polygon
          points="50,28 53,20 56,28"
          fill="url(#stg-gold)"
          opacity="0.72"
        />

        {/* ── Shark jaw / head (angular) ── */}
        {/* Upper jaw — points right */}
        <path
          d="M 4,26 L 14,20 L 20,24 L 16,28 L 4,30 Z"
          fill="url(#stg-gold)"
          filter="url(#stg-shadow)"
        />
        {/* Lower jaw / chin notch */}
        <path
          d="M 4,30 L 16,28 L 12,34 L 4,36 Z"
          fill="url(#stg-gold)"
          opacity="0.7"
        />
        {/* Jaw bite notch (dark gap between jaws) */}
        <path
          d="M 10,28 L 14,26 L 14,30 Z"
          fill="#09090b"
          opacity="0.6"
        />

        {/* ── Main body — streamlined torpedo ── */}
        <path
          d="M 16,22 Q 32,16 50,20 Q 64,22 72,18 L 80,12 L 78,24 L 80,36 L 72,30 Q 60,36 44,34 Q 28,36 16,32 Z"
          fill="url(#stg-gold)"
          filter="url(#stg-shadow)"
        />

        {/* ── Tail fins ── */}
        {/* Upper tail lobe */}
        <path
          d="M 78,12 L 88,4 L 82,22 Z"
          fill="url(#stg-gold)"
          opacity="0.92"
        />
        {/* Lower tail lobe */}
        <path
          d="M 78,36 L 88,46 L 82,28 Z"
          fill="url(#stg-gold)"
          opacity="0.85"
        />

        {/* ── Pectoral fin ── */}
        <path
          d="M 22,30 L 14,44 L 30,33 Z"
          fill="url(#stg-gold)"
          opacity="0.65"
        />

        {/* ── Belly highlight stripe (3D depth) ── */}
        <path
          d="M 20,31 Q 36,36 54,33 Q 64,31 72,28"
          stroke="url(#stg-hi)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* ── Eye ── */}
        <circle cx="10" cy="25" r="2.2" fill="#050505" />
        <circle cx="10.8" cy="24.2" r="0.7" fill="rgba(255,230,120,0.6)" />
      </svg>

      {/* ── Wordmark ── */}
      {!iconOnly && (
        <div className="flex flex-col leading-none gap-[2px]">
          <span
            className="font-black uppercase tracking-[0.12em] text-sm"
            style={{
              background: "linear-gradient(135deg, #FFE08A 0%, #D4A017 45%, #A07000 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            SharkView
          </span>
          <span
            className="text-[8px] uppercase font-semibold tracking-[0.2em]"
            style={{ color: "#7A5A18" }}
          >
            by SharkTech Global
          </span>
        </div>
      )}
    </div>
  );
};
