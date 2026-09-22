import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGINATION_SIZES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

/**
 * Pagination footer (P1.1) — plain props, no table generics. The parent
 * DataTable reads page state/total from the table instance and passes values;
 * this keeps the footer trivially testable and reusable.
 */
interface DataTablePaginationProps {
  /** Zero-based current page index. */
  pageIndex: number;
  pageSize: number;
  /** Total number of pages (>= 1). */
  pageCount: number;
  /** Total items across all pages (post-filter). */
  totalItems: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const { t } = useTranslation("common");

  return (
    <div className="grid items-center gap-3 border-t border-border px-4 py-4 text-sm sm:grid-cols-[1fr_auto_1fr]">
      <p className="text-center text-content-muted sm:text-left">
        {t("totalItems", { count: totalItems })}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border-strong transition-colors hover:border-primary hover:bg-primary/10"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
          aria-label={t("previous")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-24 text-center whitespace-nowrap font-medium text-content">
          {t("pageInfo", { page: pageIndex + 1, totalPages: pageCount })}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full border-border-strong transition-colors hover:border-primary hover:bg-primary/10"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
          aria-label={t("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2 sm:justify-self-end">
        <label htmlFor="dt-page-size" className="text-content-muted">
          {t("rowsPerPage")}
        </label>
        <select
          id="dt-page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-sm border border-border-strong bg-surface px-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]"
        >
          {PAGINATION_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
