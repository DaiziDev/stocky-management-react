import { useState } from "react";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from "lucide-react";
import { EmptyState } from "@/components/feedback/FeedbackStates";
import { DataTablePagination } from "./DataTablePagination";

/**
 * Generic DataTable (P1.1) — built on TanStack Table v9's feature-based API.
 *
 * Client-side sort/filter/pagination; wire `manualPagination` + a total count
 * later if server-side paging becomes necessary (list endpoints currently
 * return bare arrays).
 *
 * Cells default to raw values; customize via column defs `cell` renderers —
 * shared primitives (mono/date/badge/actions) live in ./cells.tsx.
 */

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  globalFilteringFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature,
});

export type AppTableFeatures = typeof features;

// Column defs are feature-generic; feature pages build them via
// createDataTableColumns<T>() below, which keeps full inference.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyColumnDef = any;

/** Typed column helper bound to the app's table feature set. */
export function createDataTableColumns<TData extends RowData>() {
  return createColumnHelper<AppTableFeatures, TData>();
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: AnyColumnDef[];
  /** Loading shows skeleton rows instead of the table body. */
  isLoading?: boolean;
  /** Overrides the default empty state content. */
  emptyState?: React.ReactNode;
  /** Message shown when `data` is empty (default: "Aucun résultat"). */
  emptyMessage?: string;
  /** Show the built-in pagination footer. */
  showPagination?: boolean;
  /** Initial page size. */
  initialPageSize?: number;
  /** Hide the table header row (e.g. compact widgets). */
  hideHeader?: boolean;
  /** Optional search input binding (controlled global filter). */
  globalFilter?: string;
  /** Optional row navigation handler. */
  onRowClick?: (row: TData) => void;
  className?: string;
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  isLoading = false,
  emptyState,
  emptyMessage,
  showPagination = true,
  initialPageSize = 10,
  hideHeader = false,
  globalFilter,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [internalFilter, setInternalFilter] = useState("");
  const effectiveFilter = globalFilter ?? internalFilter;

  const table = useTable<AppTableFeatures, TData>(
    {
      features,
      columns,
      data,
      state: { sorting, pagination, globalFilter: effectiveFilter },
      onSortingChange: setSorting,
      onPaginationChange: setPagination,
      onGlobalFilterChange: globalFilter ? undefined : setInternalFilter,
    },
    (state) => state,
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-surface dark:bg-[color:var(--dark-surface)]",
          className,
        )}
      >
        <TableSkeletonRows columnCount={columns.length} />
      </div>
    );
  }

  const EmptySlot = emptyState ?? (
    <EmptyState
      icon={<Inbox className="h-10 w-10" />}
      title={emptyMessage ?? "Aucun résultat"}
    />
  );

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-surface dark:bg-[color:var(--dark-surface)]",
          className,
        )}
      >
        {EmptySlot}
      </div>
    );
  }

  const filteredRows = table.getFilteredRowModel().rows;
  const rows = table.getRowModel().rows;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface dark:bg-[color:var(--dark-surface)]",
        className,
      )}
    >
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Tableau de données"
      >
        <table className="data-table w-full min-w-max text-sm">
          {!hideHeader && (
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border bg-surface-secondary/60 dark:bg-[color:var(--dark-surface-secondary)]"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary",
                          header.column.id === "actions" &&
                            "table-actions text-center",
                        )}
                        aria-sort={
                          sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : "none"
                        }
                      >
                        {canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 uppercase tracking-wide hover:text-content"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {sortDirection === "asc" ? (
                              <ArrowUp
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            ) : sortDirection === "desc" ? (
                              <ArrowDown
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <ArrowUpDown
                                className="h-3.5 w-3.5 opacity-40"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
          )}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{EmptySlot}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border transition-colors last:border-0 hover:bg-surface-hover dark:hover:bg-[color:var(--dark-surface-hover)]",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-4 py-3 text-content",
                        cell.column.id === "actions" &&
                          "table-actions text-center",
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <DataTablePagination
          pageIndex={table.state.pagination.pageIndex}
          pageSize={table.state.pagination.pageSize}
          pageCount={Math.max(1, table.getPageCount())}
          totalItems={filteredRows.length}
          onPageChange={(index) => table.setPageIndex(index)}
          onPageSizeChange={(size) => table.setPageSize(size)}
        />
      )}
    </div>
  );
}

/** Small skeleton used while the list query is loading. */
function TableSkeletonRows({ columnCount }: { columnCount: number }) {
  return (
    <div className="p-4">
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: columnCount }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 animate-pulse rounded bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Re-exported so feature pages don't import state types from the package directly.
export type { ColumnFiltersState, PaginationState, SortingState };
