
import { useState } from "react";
import "./SentinelLogo.css";

interface SentinelLogoProps {
  size?: number;
}

export function SentinelLogo({
  size = 48,
}: SentinelLogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMouseEnter = () => {
    // Don't restart the animation if it is already running.
    if (!isAnimating) {
      setIsAnimating(true);
    }
  };

  const handleAnimationEnd = () => {
    // Animation has completed its full rotation.
    setIsAnimating(false);
  };

  return (
    <svg
      className="sentinel-logo"
      width={size}
      height={size}
      viewBox="0 0 240 240"
      role="img"
      aria-label="Sentinel"
      onMouseEnter={handleMouseEnter}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Outer ring */}
      <g
        className={`sentinel-outer-ring ${
          isAnimating ? "sentinel-animate" : ""
        }`}
        fill="none"
        stroke="#0B5D45"
        strokeWidth="18"
        strokeLinecap="round"
      >
        <circle
          cx="120"
          cy="120"
          r="88"
          strokeDasharray="475 78"
          strokeDashoffset="0"
        />
      </g>

      {/* Inner ring */}
      <g
        className={`sentinel-inner-ring ${
          isAnimating ? "sentinel-animate" : ""
        }`}
        fill="none"
        stroke="#16805F"
        strokeWidth="18"
        strokeLinecap="round"
      >
        <circle
          cx="120"
          cy="120"
          r="49"
          strokeDasharray="265 43"
          strokeDashoffset="132.5"
        />
      </g>

      {/* Center status dot */}
      <circle
        className="sentinel-pulse"
        cx="120"
        cy="120"
        r="15"
        fill="#42C99A"
      />
    </svg>
  );
}