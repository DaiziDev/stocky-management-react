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
import { Button } from "@/components/ui/Button";
import type { Sale } from "../types";
import { useSales } from "../hooks";
import { PosCheckoutDialog } from "../components/PosCheckoutDialog";
import { hasAnyRole } from "@/lib/permissions";
import { ShoppingCart } from "lucide-react";

/** Sales history and POS checkout. Rows navigate to the sale detail page. */
export const SalesPage = () => {
  const { t } = useTranslation("sales");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [posOpen, setPosOpen] = useState(false);
  const canSell = hasAnyRole(["ADMIN", "GESTIONNAIRE", "VENDEUR"]);
  const listQuery = useSales();

  const columns = useMemo(() => {
    const helper = createDataTableColumns<Sale>();
    return [
      helper.accessor("code", {
        header: t("fields.code"),
        cell: (info) => (
          <button
            type="button"
            className="font-mono text-sm text-primary hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/sales/${info.row.original.id}`);
            }}
          >
            {info.getValue()}
          </button>
        ),
      }),
      helper.accessor("date", {
        header: t("fields.date"),
        cell: (info) => <DateCell value={info.getValue()} withTime />,
      }),
      helper.accessor("customerName", {
        header: t("fields.customer"),
        cell: (info) => {
          const sale = info.row.original;
          if (sale.customerId) {
            return (
              <Link
                to={`/customers/${sale.customerId}`}
                className="text-content hover:text-primary hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {sale.customerName}
              </Link>
            );
          }
          return <span className="text-content-muted">{t("anonymous")}</span>;
        },
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
          canSell && (
            <Button variant="gold" onClick={() => setPosOpen(true)}>
              <ShoppingCart className="h-4 w-4" />
              {t("posTitle")}
            </Button>
          )
        }
      />

      <DataTable<Sale>
        data={listQuery.data ?? []}
        columns={columns}
        isLoading={listQuery.isLoading}
        globalFilter={search}
        onRowClick={(sale) => navigate(`/sales/${sale.id}`)}
      />

      <PosCheckoutDialog open={posOpen} onClose={() => setPosOpen(false)} />
    </div>
  );
};
