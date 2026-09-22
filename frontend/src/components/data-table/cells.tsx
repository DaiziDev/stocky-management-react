import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

/**
 * Shared table cell primitives (P1.1) — drop into column defs:
 *   cell: (info) => <MonoCell value={info.getValue()} />
 * Keeps every list page visually consistent (mono numerals, date formats,
 * status badges, row-action menus).
 */

/** Monospace cell for codes, SKUs, ids. */
export function MonoCell({
  value,
  className,
}: {
  value?: string | number | null;
  className?: string;
}) {
  return (
    <span className={cn("font-mono text-[13px]", className)}>
      {value ?? "—"}
    </span>
  );
}

/** Date cell — short date by default, datetime for timestamps. */
export function DateCell({
  value,
  withTime = false,
}: {
  value?: string | Date | null;
  withTime?: boolean;
}) {
  if (!value) return <span>—</span>;
  return <span>{withTime ? formatDateTime(value) : formatDate(value)}</span>;
}

/** Currency cell — uses the app currency (see lib/constants CURRENCY). */
export function CurrencyCell({
  value,
  className,
}: {
  value?: number | null;
  className?: string;
}) {
  if (value === null || value === undefined) return <span>—</span>;
  return (
    <span className={cn("tabular-nums", className)}>
      {formatCurrency(value)}
    </span>
  );
}

/** Quantity cell with sign coloring (+ green, − red) for movements. */
export function QuantityCell({ value }: { value?: number | null }) {
  if (value === null || value === undefined) return <span>—</span>;
  return (
    <span
      className={cn(
        "tabular-nums",
        value > 0 && "text-success-600 dark:text-success-500",
        value < 0 && "text-danger-600 dark:text-danger-500",
      )}
    >
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

interface BadgeCellProps {
  label: string;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "gold"
    | "secondary";
}

/** Status/badge cell for enum columns. */
export function BadgeCell({ label, variant = "default" }: BadgeCellProps) {
  return <Badge variant={variant}>{label}</Badge>;
}

/** Row-actions cell — renders the actions menu trigger; menu items come from `actions`. */
export function ActionsCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Actions"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
        {children}
      </Button>
    </div>
  );
}
