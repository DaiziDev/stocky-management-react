import { forwardRef, HTMLAttributes } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { Sparkline } from "./Sparkline";

export type StatTone = "gold" | "success" | "info" | "danger";

export interface StatTrend {
  direction: "up" | "down";
  value: string;
}

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  label: string;
  icon: typeof ArrowUp;
  trend?: StatTrend;
  sparkData?: number[];
  tone?: StatTone;
  /** Appended after the count-up value (e.g. currency or unit). */
  suffix?: string;
}

/** Per-tone chip bg/fg + sparkline color (mockup §23 — sparkline strokes reference tokens). */
const TONES: Record<StatTone, { chip: string; spark: string }> = {
  gold: {
    chip: "bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400",
    spark: "var(--color-accent-500)",
  },
  success: {
    chip: "bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-500",
    spark: "var(--color-success-500)",
  },
  info: {
    chip: "bg-info-100 text-info-700 dark:bg-info-500/15 dark:text-info-500",
    spark: "var(--color-info-500)",
  },
  danger: {
    chip: "bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-500",
    spark: "var(--color-danger-500)",
  },
};

/**
 * Dashboard KPI tile — mockup `.kpi-card`: surface, border, radius-lg, 21px
 * padding; 40px icon chip + trend pill; mono 28px count-up value; sparkline
 * bottom-right; hover lift −2px + shadow-md.
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      value,
      label,
      icon: Icon,
      trend,
      sparkData,
      tone = "gold",
      suffix,
      className,
      ...props
    },
    ref,
  ) => {
    const displayValue = useCountUp(value);
    const toneStyle = TONES[tone];

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg border border-border bg-surface p-[21px] shadow-xs",
          "transition-[transform,box-shadow] duration-200",
          "hover:-translate-y-0.5 hover:shadow-md",
          className,
        )}
        {...props}
      >
        <div className="mb-4 flex items-center justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              toneStyle.chip,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11.5px] font-bold",
                trend.direction === "up"
                  ? "bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                  : "bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-500",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
              ) : (
                <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        <div className="font-mono text-[28px] font-semibold tracking-[-0.02em] text-content">
          {displayValue.toLocaleString("fr-FR")}
          {suffix && (
            <span className="ml-1 text-base font-medium text-content-secondary">
              {suffix}
            </span>
          )}
        </div>
        <div className="mt-1 text-[12.6px] text-content-secondary">{label}</div>

        {sparkData && sparkData.length > 1 && (
          <div className="pointer-events-none absolute bottom-0 right-0 opacity-90">
            <Sparkline points={sparkData} color={toneStyle.spark} />
          </div>
        )}
      </div>
    );
  },
);

StatCard.displayName = "StatCard";
