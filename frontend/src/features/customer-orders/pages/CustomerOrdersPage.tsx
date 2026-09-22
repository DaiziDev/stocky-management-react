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
import type { CustomerOrder, OrderStatus } from "../types";
import { useCustomerOrders } from "../hooks";
import { Button } from "@/components/ui/Button";
import { CustomerOrderFormDialog } from "../components/CustomerOrderFormDialog";
import { Plus } from "lucide-react";
import { OrderStatusBadge } from "../components/OrderStatusBadge";

/**
 * CustomerOrdersPage (P4.2) — list of «commandes-client».
 * Read-first: statuses, dates and totals; rows link to the details page,
 * which owns the lifecycle actions and the line-items table. Creating an
 * order is done from the details flow (P4.2 create dialog comes with the
 * POS/sale work in P5.4 — the backend model is the same).
 */
export const CustomerOrdersPage = () => {
  const { t } = useTranslation("customer-orders");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = useCustomerOrders();

  const filteredOrders = useMemo(() => {
    const orders = listQuery.data ?? [];
    if (statusFilter === "ALL") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [listQuery.data, statusFilter]);

  const columns = useMemo(() => {
    const helper = createDataTableColumns<CustomerOrder>();
    return [
      helper.accessor("code", {
        header: t("fields.code"),
        cell: (info) => (
          <Link
            to={`/customer-orders/${info.row.original.id}`}
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
      helper.accessor("customerName", {
        header: t("fields.customer"),
      }),
      helper.accessor("status", {
        header: t("fields.status"),
        cell: (info) => <OrderStatusBadge status={info.getValue()} />,
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
              setStatusFilter(event.target.value as OrderStatus | "ALL")
            }
            aria-label={t("statusFilter")}
            className="w-full rounded-sm border border-border-strong bg-surface px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-[color:var(--dark-border)] dark:bg-[color:var(--dark-input)]"
          >
            <option value="ALL">{t("allStatuses")}</option>
            <option value="EN_COURS">{t("status.EN_COURS")}</option>
            <option value="VALIDEE">{t("status.VALIDEE")}</option>
            <option value="EXPEDIEE">{t("status.EXPEDIEE")}</option>
            <option value="LIVREE">{t("status.LIVREE")}</option>
            <option value="ANNULEE">{t("status.ANNULEE")}</option>
          </select>
        </div>
      </DataTableToolbar>

      <DataTable<CustomerOrder>
        data={filteredOrders}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
        onRowClick={(order) => navigate(`/customer-orders/${order.id}`)}
      />

      <CustomerOrderFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
};
