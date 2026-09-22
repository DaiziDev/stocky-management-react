import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";

/**
 * Toolbar (P1.1) — search box + optional children (filters, actions).
 * The search input feeds the DataTable's global filter.
 */
interface DataTableToolbarProps {
  /** Controlled search value (bind to the table's globalFilter). */
  search: string;
  onSearchChange: (value: string) => void;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Filters, create button, column visibility, etc. */
  children?: React.ReactNode;
  /** Right-aligned actions area (create button, export, …). */
  actions?: React.ReactNode;
  /** Hide the search box for fixed small tables. */
  hideSearch?: boolean;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
  actions,
  hideSearch,
}: DataTableToolbarProps) {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!hideSearch && (
        <div className="w-full max-w-xs">
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder ?? t("search")}
            leadingIcon={<Search />}
            aria-label={t("search")}
          />
        </div>
      )}
      {children}
      {actions && (
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** Column-visibility toggle button — pass `table` from the DataTable render prop. */
export function ColumnsVisibilityButton({
  visibleColumns,
  onToggleColumn,
}: {
  visibleColumns: Array<{ id: string; label: string; isVisible: boolean }>;
  onToggleColumn: (id: string) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-sm border border-border-strong px-3 py-2 text-sm text-content hover:bg-surface-hover"
        aria-haspopup="true"
        aria-label={t("columns")}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {t("columns")}
      </button>
      <div className="absolute right-0 z-10 mt-1 hidden w-48 rounded-md border border-border bg-surface py-1 shadow-lg peer-focus:block">
        {visibleColumns.map((col) => (
          <label
            key={col.id}
            className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-content hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              checked={col.isVisible}
              onChange={() => onToggleColumn(col.id)}
            />
            {col.label}
          </label>
        ))}
      </div>
    </div>
  );
}
