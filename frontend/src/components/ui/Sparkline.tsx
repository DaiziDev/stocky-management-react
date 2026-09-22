import { useId } from "react";

interface SparklineProps {
  points: number[];
  /** Stroke color — brand tone per KPI (gold / success / info / danger). */
  color: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Minimal inline SVG sparkline (mockup `sparkline()` helper): 2px rounded
 * stroke, ~55% opacity, no axes. Rendered bottom-right of StatCard.
 */
export function Sparkline({
  points,
  color,
  width = 90,
  height = 32,
  className,
}: SparklineProps) {
  const gradientId = useId();

  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map(
    (point, index) =>
      [
        index * stepX,
        height - 2 - ((point - min) / range) * (height - 4),
      ] as const,
  );

  const path = coords
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
    )
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill={`url(#${gradientId})`}
        stroke="none"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );
}
