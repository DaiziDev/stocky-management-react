import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
  DataTable,
  DataTableToolbar,
  createDataTableColumns,
  DateCell,
  CurrencyCell,
} from "@/components/data-table";
import type { SupplierOrder, SupplierOrderStatus } from "../types";
import { useSupplierOrders } from "../hooks";
import { Button } from "@/components/ui/Button";
import { SupplierOrderFormDialog } from "../components/SupplierOrderFormDialog";
import { Plus } from "lucide-react";
import { SupplierOrderStatusBadge } from "../components/SupplierOrderStatusBadge";

/**
 * SupplierOrdersPage (P4.3) — list of «commandes-fournisseur».
 * Rows link to the details page, which owns the lifecycle actions
 * (receptionner / annuler) and the line-items table.
 */
export const SupplierOrdersPage = () => {
  const { t } = useTranslation("supplier-orders");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierOrderStatus | "ALL">(
    "ALL",
  );
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = useSupplierOrders();

  const filteredOrders = useMemo(() => {
    const orders = listQuery.data ?? [];
    if (statusFilter === "ALL") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [listQuery.data, statusFilter]);

  const columns = useMemo(() => {
    const helper = createDataTableColumns<SupplierOrder>();
    return [
      helper.accessor("code", {
        header: t("fields.code"),
        cell: (info) => (
          <Link
            to={`/supplier-orders/${info.row.original.id}`}
            className="font-mono text-sm text-primary hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      helper.accessor("date", {
        header: t("fields.date"),
        cell: (info) => <DateCell value={info.getValue()} withTime />,
      }),
      helper.accessor("supplierName", {
        header: t("fields.supplier"),
      }),
      helper.accessor("status", {
        header: t("fields.status"),
        cell: (info) => <SupplierOrderStatusBadge status={info.getValue()} />,
      }),
      helper.accessor((row) => row.lines.length, {
        id: "lines",
        header: t("linesCard"),
      }),
      helper.accessor("total", {
        header: t("fields.total"),
        cell: (info) => <CurrencyCell value={info.getValue()} />,
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

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search")}
        actions={
          <Button variant="gold" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("createTitle")}
          </Button>
        }
      >
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as SupplierOrderStatus | "ALL")
            }
            aria-label={t("statusFilter")}
            className="w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]"
          >
            <option value="ALL">{t("allStatuses")}</option>
            <option value="EN_ATTENTE">{t("status.EN_ATTENTE")}</option>
            <option value="RECUE_PARTIELLEMENT">
              {t("status.RECUE_PARTIELLEMENT")}
            </option>
            <option value="RECUE">{t("status.RECUE")}</option>
            <option value="ANNULEE">{t("status.ANNULEE")}</option>
          </select>
        </div>
      </DataTableToolbar>

      <DataTable<SupplierOrder>
        data={filteredOrders}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
        onRowClick={(order) => navigate(`/supplier-orders/${order.id}`)}
      />

      <SupplierOrderFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
};
