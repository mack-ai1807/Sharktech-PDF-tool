import React from "react";

interface SharkLogoProps {
  /** Height class applied to the wrapper (e.g. "h-8", "h-12", "h-14") */
  className?: string;
  /** Unused — kept for API compatibility */
  iconOnly?: boolean;
}

/**
 * SharkTech Global + VCPility combined brand mark.
 * Uses the official PNG with transparent background — renders directly
 * on the dark toolbar/canvas with no white pill needed.
 */
export const SharkLogo: React.FC<SharkLogoProps> = ({
  className = "h-10",
}) => {
  return (
    <img
      src="/sharktech-logo.png"
      alt="SharkTech Global & VCPility"
      className={`inline-flex flex-shrink-0 select-none object-contain ${className}`}
      draggable={false}
    />
  );
};
