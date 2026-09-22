import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CurrencyCell,
  DataTable,
  DateCell,
  createDataTableColumns,
} from "@/components/data-table";
import {
  useSupplierOrder,
  useReceiveSupplierOrder,
  useCancelSupplierOrder,
} from "../hooks";
import { SupplierOrderStatusBadge } from "../components/SupplierOrderStatusBadge";
import { PartialReceptionDialog } from "../components/PartialReceptionDialog";
import { SUPPLIER_ORDER_TRANSITIONS, type SupplierOrderLine } from "../types";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { hasAnyRole } from "@/lib/permissions";
import {
  ArrowLeft,
  Ban,
  PackageCheck,
  PackageOpen,
  PackagePlus,
} from "lucide-react";

type LifecycleAction = "receive" | "cancel" | null;

/**
 * SupplierOrderDetailsPage (P4.3) — the restocking flow:
 * header (code, supplier, date, status), line-items table with server-priced
 * lines, totals footer, and the lifecycle actions:
 *  - Réceptionner → PUT /{id}/receptionner: credits stock with the FULL
 *    ordered quantity per line; refused once the order is complete
 *  - Réception partielle → PUT /{id}/receptionner-partiel: credits only what
 *    was actually delivered, leaving the order RECUE_PARTIELLEMENT so the
 *    remainder can be received later
 *  - Annuler (EN_ATTENTE only) → PUT /{id}/annuler, behind a confirm dialog
 *
 * Which buttons appear is driven by SUPPLIER_ORDER_TRANSITIONS, not by
 * ad-hoc status checks.
 * Route: /supplier-orders/:id.
 */
export const SupplierOrderDetailsPage = () => {
  const { t } = useTranslation("supplier-orders");
  const { id } = useParams<{ id: string }>();

  const [lifecycleAction, setLifecycleAction] = useState<LifecycleAction>(null);
  const [partialOpen, setPartialOpen] = useState(false);

  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);

  const orderQuery = useSupplierOrder(id ?? "");
  const receiveOrder = useReceiveSupplierOrder();
  const cancelOrder = useCancelSupplierOrder();

  const order = orderQuery.data;

  const lineColumns = useMemo(() => {
    const helper = createDataTableColumns<SupplierOrderLine>();
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

  const handleConfirm = async () => {
    if (!order) return;
    if (lifecycleAction === "receive") {
      await receiveOrder.mutateAsync(order.id);
    } else if (lifecycleAction === "cancel") {
      await cancelOrder.mutateAsync(order.id);
    }
    setLifecycleAction(null);
  };

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto max-w-md space-y-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 animate-pulse rounded bg-surface-secondary dark:bg-[color:var(--dark-surface-secondary)]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <DetailsHeader title={t("detailTitle")} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PackageOpen
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound")}
            </h2>
            <p className="text-sm text-content-muted">{t("notFoundHint")}</p>
            <Link to="/supplier-orders">
              <Button variant="outline">{t("backToList")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allowed actions come from the contract's lifecycle table rather than an
  // ad-hoc status check: a partially received order can still receive more.
  const allowed = SUPPLIER_ORDER_TRANSITIONS[order.status];
  const showLifecycle =
    canManage && (allowed.receive || allowed.receivePartial || allowed.cancel);

  return (
    <div className="space-y-6">
      <DetailsHeader
        title={order.code}
        status={<SupplierOrderStatusBadge status={order.status} />}
        actions={
          showLifecycle ? (
            <>
              {allowed.cancel && (
                <Button
                  variant="outline"
                  onClick={() => setLifecycleAction("cancel")}
                >
                  <Ban className="h-4 w-4" />
                  {t("cancel")}
                </Button>
              )}
              {allowed.receivePartial && (
                <Button variant="outline" onClick={() => setPartialOpen(true)}>
                  <PackagePlus className="h-4 w-4" />
                  {t("reception.cta")}
                </Button>
              )}
              {allowed.receive && (
                <Button
                  variant="gold"
                  onClick={() => setLifecycleAction("receive")}
                >
                  <PackageCheck className="h-4 w-4" />
                  {t("receive")}
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      {/* Order header card */}
      <Card>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            <Detail label={t("fields.supplier")}>
              <Link
                to={`/suppliers/${order.supplierId}`}
                className="text-primary hover:underline"
              >
                {order.supplierName}
              </Link>
            </Detail>
            <Detail label={t("fields.date")}>
              <DateCell value={order.date} withTime />
            </Detail>
            <Detail label={t("fields.status")}>
              <SupplierOrderStatusBadge status={order.status} />
            </Detail>
            <Detail label={t("fields.total")}>
              <span className="text-lg font-semibold">
                <CurrencyCell value={order.total} />
              </span>
            </Detail>
          </dl>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>{t("linesCard")}</CardTitle>
          <Badge variant="secondary">
            {t("linesCount", { count: order.lines.length })}
          </Badge>
        </CardHeader>
        <CardContent>
          <DataTable<SupplierOrderLine>
            data={order.lines}
            columns={lineColumns}
            showPagination={false}
            emptyMessage={t("linesCard")}
          />
          <div className="mt-4 flex items-center justify-end gap-4 border-t border-border pt-4 text-sm dark:border-[color:var(--dark-border)]">
            <span className="text-content-secondary">{t("fields.total")}</span>
            <span className="text-base font-bold text-content">
              <CurrencyCell value={order.total} />
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Partial reception — per-line quantities actually delivered */}
      <PartialReceptionDialog
        order={order}
        open={partialOpen}
        onClose={() => setPartialOpen(false)}
      />

      {/* Lifecycle confirms — explicit labels so the delete wording never leaks */}
      <ConfirmDialog
        open={lifecycleAction === "receive"}
        onClose={() => setLifecycleAction(null)}
        title={t("receiveTitle")}
        entityName={order.code}
        description={t("receiveConfirm")}
        confirmLabel={t("receive")}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={lifecycleAction === "cancel"}
        onClose={() => setLifecycleAction(null)}
        title={t("cancelTitle")}
        entityName={order.code}
        confirmLabel={t("cancel")}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

/** Page header: back link, order code + status chip and lifecycle actions. */
function DetailsHeader({
  title,
  status,
  actions,
}: {
  title: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { t } = useTranslation("supplier-orders");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/supplier-orders"
          className="rounded-[9px] p-2 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content"
          aria-label={t("backToList")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-content">{title}</h1>
          {status}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/** Definition-list row helper. */
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
