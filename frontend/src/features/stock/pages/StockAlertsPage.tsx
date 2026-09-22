import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
} from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/Card";
import { PackageCheck } from "lucide-react";
import type { StockRow } from "../types";
import { useStockAlertes } from "../hooks";
import { StockStatusBadge } from "../components/StockStatusBadge";

/**
 * StockAlertsPage (P5.3) — articles whose stock has reached or fallen below
 * their minimum threshold (server-filtered via /api/stock/alertes). Severity
 * bar: red when out of stock, orange when at/below threshold. There is no
 * acknowledge/resolve endpoint in swagger v1.0 — resolving means restocking
 * (supplier-order reception), so rows link to the article and the list
 * refreshes when stock changes (queries invalidated by the lifecycle hooks).
 */
export const StockAlertsPage = () => {
  const { t } = useTranslation("stock");

  const [search, setSearch] = useState("");

  const alertesQuery = useStockAlertes();
  const rows = alertesQuery.data ?? [];

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
        cell: (info) => (
          <span
            className={`tabular-nums font-semibold ${info.getValue() <= 0 ? "text-danger-600 dark:text-danger-500" : "text-warning-600 dark:text-warning-500"}`}
          >
            {info.getValue()}
          </span>
        ),
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
        id: "severity",
        header: t("fields.status"),
        cell: (info) => {
          const row = info.row.original;
          const pct =
            row.minThreshold > 0
              ? Math.min(
                  100,
                  Math.round((row.currentStock / row.minThreshold) * 100),
                )
              : 0;
          return (
            <div className="flex items-center justify-end gap-3">
              <div
                className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)] lg:block"
                role="progressbar"
                aria-valuenow={row.currentStock}
                aria-valuemin={0}
                aria-valuemax={row.minThreshold}
                aria-label={t("fields.currentStock")}
              >
                <div
                  className={`h-full ${row.currentStock <= 0 ? "bg-danger-500" : "bg-warning-500"}`}
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

  if (!alertesQuery.isLoading && rows.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-content">
            {t("alertsTitle")}
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            {t("alertsSubtitle")}
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PackageCheck
              className="h-10 w-10 text-success-500"
              aria-hidden="true"
            />
            <p className="text-sm text-content-muted">{t("noAlerts")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">{t("alertsTitle")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("alertsSubtitle")}</p>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search")}
      />

      <DataTable<StockRow>
        data={rows}
        columns={columns}
        isLoading={alertesQuery.isLoading}
        globalFilter={search}
      />
    </div>
  );
};
