import { useEffect, useRef, useState } from "react";

/**
 * Count-up animation (mockup `data-count`): eases from 0 to `value` over
 * ~700ms with 16ms ticks. Re-runs when `value` changes.
 */
export function useCountUp(value: number, durationMs = 700): number {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return display;
}
