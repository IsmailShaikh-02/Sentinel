import { useEffect, useRef } from "react";
import "./SentinelLogo.css";

interface SanturaLogoProps {
  size?: number;

  // Time to wait before each rotation (milliseconds)
  pauseDuration?: number;

  // Time taken to complete one rotation (milliseconds)
  rotationDuration?: number;
}

export function SentinelLogo({
  size = 48,
  pauseDuration = 20_000,
  rotationDuration = 3_000,
}: SanturaLogoProps) {
  const outerRingRef = useRef<SVGGElement>(null);
  const innerRingRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const outerRing = outerRingRef.current;
    const innerRing = innerRingRef.current;

    if (!outerRing || !innerRing) {
      return;
    }

    let timeoutId: number | undefined;
    let animationId: number | undefined;

    const rotate = () => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;

        const progress = Math.min(
          elapsed / rotationDuration,
          1
        );

        // Smooth ease-in-out
        const easedProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const rotation = easedProgress * 360;

        outerRing.style.transform = `rotate(${rotation}deg)`;
        innerRing.style.transform = `rotate(${-rotation}deg)`;

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          // Rotation finished.
          // Wait before starting the next rotation.
          timeoutId = window.setTimeout(
            rotate,
            pauseDuration
          );
        }
      };

      animationId = requestAnimationFrame(animate);
    };

    // Initial pause before the first rotation.
    timeoutId = window.setTimeout(
      rotate,
      pauseDuration
    );

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (animationId !== undefined) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [pauseDuration, rotationDuration]);

  return (
    <svg
      className="santura-logo"
      width={size}
      height={size}
      viewBox="0 0 240 240"
      role="img"
      aria-label="Santura"
    >
      {/* Outer ring */}
      <g
        ref={outerRingRef}
        className="santura-outer-ring"
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
        ref={innerRingRef}
        className="santura-inner-ring"
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
        className="santura-pulse"
        cx="120"
        cy="120"
        r="15"
        fill="#42C99A"
      />
    </svg>
  );
}


