import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
} from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/Card";
import { CurrencyCell } from "@/components/data-table";
import type { StockRow } from "../types";
import { useStockEtat, useStockValorisation, useStockAlertes } from "../hooks";
import { StockStatusBadge, stockLevel } from "../components/StockStatusBadge";

/**
 * StockPage (P5.1) — read-only stock overview:
 * valuation total + alert count as summary cards, then the per-article table
 * with status badges (Rupture/Stock faible/En stock). Article codes link to
 * the article details page.
 */
export const StockPage = () => {
  const { t } = useTranslation("stock");

  const [search, setSearch] = useState("");

  const etatQuery = useStockEtat();
  const valorisationQuery = useStockValorisation();
  const alertesQuery = useStockAlertes();

  const rows = etatQuery.data ?? [];
  const alertCount = alertesQuery.data?.length ?? 0;

  const columns = useMemo(() => {
    const helper = createDataTableColumns<StockRow>();
    return [
      helper.accessor("code", {
        header: t("fields.code"),
        cell: (info) => (
          <Link
            to={`/catalog/articles/${info.row.original.articleId}`}
            className="font-mono text-sm text-primary hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      helper.accessor("designation", {
        header: t("fields.designation"),
      }),
      helper.accessor("currentStock", {
        header: t("fields.currentStock"),
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      helper.accessor("minThreshold", {
        header: t("fields.minThreshold"),
        cell: (info) => (
          <span className="tabular-nums text-content-secondary">
            {info.getValue()}
          </span>
        ),
      }),
      helper.display({
        id: "level",
        header: t("fields.status"),
        // Numeric accessor key on the original row keeps sorting stable.
        cell: (info) => {
          const row = info.row.original;
          const pct =
            row.minThreshold > 0
              ? Math.min(
                  100,
                  Math.round((row.currentStock / (row.minThreshold * 2)) * 100),
                )
              : 100;
          const color =
            row.currentStock <= 0
              ? "bg-danger-500"
              : stockLevel(row) === "LOW"
                ? "bg-warning-500"
                : "bg-success-500";
          return (
            <div className="flex items-center justify-end gap-3">
              <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)] lg:block">
                <div
                  className={`h-full ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <StockStatusBadge row={row} />
            </div>
          );
        },
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-content-secondary">{t("totalValue")}</p>
            <p className="mt-1 text-2xl font-bold text-content">
              <CurrencyCell value={valorisationQuery.data ?? null} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-content-secondary">{t("alertsCount")}</p>
            <p className="mt-1 text-2xl font-bold text-content">
              <span
                className={
                  alertCount > 0
                    ? "text-danger-600 dark:text-danger-500"
                    : undefined
                }
              >
                {alertCount}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search")}
      />

      <DataTable<StockRow>
        data={rows}
        columns={columns}
        isLoading={etatQuery.isLoading}
        globalFilter={search}
      />
    </div>
  );
};
