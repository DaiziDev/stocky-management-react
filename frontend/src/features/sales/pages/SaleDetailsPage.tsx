import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { ArrowLeft, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CurrencyCell,
  DataTable,
  DateCell,
  createDataTableColumns,
} from "@/components/data-table";
import { useSale } from "../hooks";
import type { SaleLine } from "../types";

export const SaleDetailsPage = () => {
  const { t } = useTranslation("sales");
  const { id } = useParams<{ id: string }>();
  const saleQuery = useSale(id ?? "");
  const sale = saleQuery.data;

  const lineColumns = useMemo(() => {
    const helper = createDataTableColumns<SaleLine>();
    return [
      helper.accessor("articleDesignation", {
        header: t("fields.article"),
        cell: (info) => (
          <Link
            to={`/catalog/articles/${info.row.original.articleId}`}
            className="hover:text-primary hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      helper.accessor("quantity", {
        header: t("fields.quantity"),
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      helper.accessor("unitPrice", {
        header: t("fields.unitPrice"),
        cell: (info) => <CurrencyCell value={info.getValue()} />,
      }),
      helper.accessor("subTotal", {
        header: t("fields.subTotal"),
        cell: (info) => (
          <span className="font-medium">
            <CurrencyCell value={info.getValue()} />
          </span>
        ),
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  if (saleQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto max-w-md space-y-3" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="h-5 animate-pulse rounded bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Receipt
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound")}
            </h2>
            <p className="text-sm text-content-muted">{t("notFoundHint")}</p>
            <Link to="/sales">
              <Button variant="outline">{t("backToList")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailsHeader title={sale.code} />
      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <Detail label={t("fields.date")}>
              <DateCell value={sale.date} withTime />
            </Detail>
            <Detail label={t("fields.customer")}>
              {sale.customerId ? (
                <Link
                  to={`/customers/${sale.customerId}`}
                  className="text-primary hover:underline"
                >
                  {sale.customerName}
                </Link>
              ) : (
                <span className="text-content-muted">{t("anonymous")}</span>
              )}
            </Detail>
            <Detail label={t("linesCard")}>{sale.lines.length}</Detail>
            <Detail label={t("fields.total")}>
              <span className="text-lg font-semibold">
                <CurrencyCell value={sale.total} />
              </span>
            </Detail>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("linesCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<SaleLine>
            data={sale.lines}
            columns={lineColumns}
            showPagination={false}
            emptyMessage={t("linesCard")}
          />
          <div className="mt-4 flex items-center justify-end gap-4 border-t border-border pt-4 text-sm dark:border-[color:var(--dark-border)]">
            <span className="text-content-secondary">{t("fields.total")}</span>
            <span className="text-base font-bold text-content">
              <CurrencyCell value={sale.total} />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function DetailsHeader({ title }: { title: string }) {
  const { t } = useTranslation("sales");
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/sales"
        className="rounded-[9px] p-2 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
        aria-label={t("backToList")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-2xl font-bold text-content">{title}</h1>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm text-content-secondary">{label}</dt>
      <dd className="mt-0.5 text-content">{children}</dd>
    </div>
  );
}
