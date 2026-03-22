import React from "react";

interface SharkLogoProps {
  /** Height class applied to the wrapper (e.g. "h-8", "h-12") */
  className?: string;
  /** Show just the shark icon — no wordmark */
  iconOnly?: boolean;
}

/**
 * SharkTech Global brand mark — premium gold shark silhouette + "SharkView" wordmark.
 */
export const SharkLogo: React.FC<SharkLogoProps> = ({
  className = "h-8",
  iconOnly = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ── Shark icon ── */}
      <svg
        viewBox="0 0 64 44"
        fill="none"
        className="h-full w-auto drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sv-fin" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="45%" stopColor="#D4A017" />
            <stop offset="100%" stopColor="#8A6200" />
          </linearGradient>
          <linearGradient id="sv-body" x1="0%" y1="10%" x2="100%" y2="90%">
            <stop offset="0%" stopColor="#F5CC5A" />
            <stop offset="35%" stopColor="#C9960C" />
            <stop offset="100%" stopColor="#7A5A00" />
          </linearGradient>
          <linearGradient id="sv-tail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0B030" />
            <stop offset="100%" stopColor="#8A6200" />
          </linearGradient>
          <filter id="sv-glow" x="-10%" y="-20%" width="120%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dorsal fin — tall, swept back */}
        <path
          d="M26 22 L33 4 L40 22"
          fill="url(#sv-fin)"
          opacity="0.97"
          filter="url(#sv-glow)"
        />

        {/* Secondary dorsal nub */}
        <path
          d="M38 22 L41 16 L44 22"
          fill="url(#sv-fin)"
          opacity="0.7"
        />

        {/* Main body — streamlined torpedo shape */}
        <path
          d="M5 25 Q16 17 30 22 Q42 26 52 21 L60 14 L58 24 L60 33 L52 28 Q40 33 24 30 Q12 32 5 27 Z"
          fill="url(#sv-body)"
          filter="url(#sv-glow)"
        />

        {/* Tail fin — upper lobe */}
        <path
          d="M58 14 L63 8 L60 22 Z"
          fill="url(#sv-tail)"
          opacity="0.9"
        />

        {/* Tail fin — lower lobe */}
        <path
          d="M58 33 L63 40 L60 26 Z"
          fill="url(#sv-tail)"
          opacity="0.85"
        />

        {/* Pectoral fin */}
        <path
          d="M15 26 L8 36 L22 28 Z"
          fill="url(#sv-body)"
          opacity="0.75"
        />

        {/* Belly highlight — gives 3D depth */}
        <path
          d="M10 27 Q20 31 34 29 Q44 27 52 25"
          stroke="rgba(255,220,100,0.25)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eye */}
        <circle cx="9" cy="23.5" r="2" fill="#050505" />
        <circle cx="9.6" cy="22.9" r="0.6" fill="rgba(255,220,100,0.5)" />
      </svg>

      {/* ── Wordmark ── */}
      {!iconOnly && (
        <div className="flex flex-col leading-none gap-px">
          <span
            className="font-extrabold tracking-widest text-sm uppercase"
            style={{
              background: "linear-gradient(135deg, #FFE08A 0%, #D4A017 45%, #A87800 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.1em",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            SharkView
          </span>
          <span
            className="text-[8px] uppercase font-semibold"
            style={{
              letterSpacing: "0.22em",
              color: "#8A6A20",
            }}
          >
            by SharkTech Global
          </span>
        </div>
      )}
    </div>
  );
};
