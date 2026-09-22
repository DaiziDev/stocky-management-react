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
  useCustomerOrder,
  useValidateCustomerOrder,
  useShipCustomerOrder,
  useDeliverCustomerOrder,
  useCancelCustomerOrder,
} from "../hooks";
import { ORDER_TRANSITIONS, type OrderLine } from "../types";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { hasAnyRole } from "@/lib/permissions";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

type LifecycleAction = "validate" | "ship" | "deliver" | "cancel" | null;

/**
 * CustomerOrderDetailsPage (P4.2) — the core order flow:
 * header (code, customer, date, status), line-items table with server-priced
 * lines, totals footer, and the lifecycle actions:
 *  - Valider (EN_COURS only) → PUT /{id}/valider (server generates stock exits; 409 on insufficient stock)
 *  - Annuler (EN_COURS only) → PUT /{id}/annuler, behind a confirm dialog
 * Route: /customer-orders/:id.
 */
export const CustomerOrderDetailsPage = () => {
  const { t } = useTranslation("customer-orders");
  const { id } = useParams<{ id: string }>();

  const [lifecycleAction, setLifecycleAction] = useState<LifecycleAction>(null);

  const canManage = hasAnyRole(["ADMIN", "GESTIONNAIRE"]);

  const orderQuery = useCustomerOrder(id ?? "");
  const validateOrder = useValidateCustomerOrder();
  const shipOrder = useShipCustomerOrder();
  const deliverOrder = useDeliverCustomerOrder();
  const cancelOrder = useCancelCustomerOrder();

  const order = orderQuery.data;

  const lineColumns = useMemo(() => {
    const helper = createDataTableColumns<OrderLine>();
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
    const run = {
      validate: validateOrder,
      ship: shipOrder,
      deliver: deliverOrder,
      cancel: cancelOrder,
    }[lifecycleAction ?? "validate"];
    if (lifecycleAction) await run.mutateAsync(order.id);
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
            <ShoppingCart
              className="h-10 w-10 text-content-disabled"
              aria-hidden="true"
            />
            <h2 className="text-lg font-medium text-content">
              {t("notFound")}
            </h2>
            <p className="text-sm text-content-muted">{t("notFoundHint")}</p>
            <Link to="/customer-orders">
              <Button variant="outline">{t("backToList")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Which buttons to show is decided by the contract's lifecycle table, not
  // by ad-hoc status checks: an order can only move one step at a time.
  const allowed = ORDER_TRANSITIONS[order.status];
  const showLifecycle =
    canManage &&
    (allowed.validate || allowed.ship || allowed.deliver || allowed.cancel);

  return (
    <div className="space-y-6">
      <DetailsHeader
        title={order.code}
        status={<OrderStatusBadge status={order.status} />}
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
              {allowed.validate && (
                <Button
                  variant="gold"
                  onClick={() => setLifecycleAction("validate")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("validate")}
                </Button>
              )}
              {allowed.ship && (
                <Button
                  variant="gold"
                  onClick={() => setLifecycleAction("ship")}
                >
                  <Truck className="h-4 w-4" />
                  {t("ship")}
                </Button>
              )}
              {allowed.deliver && (
                <Button
                  variant="gold"
                  onClick={() => setLifecycleAction("deliver")}
                >
                  <PackageCheck className="h-4 w-4" />
                  {t("deliver")}
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
            <Detail label={t("fields.customer")}>
              <Link
                to={`/customers/${order.clientId}`}
                className="text-primary hover:underline"
              >
                {order.customerName}
              </Link>
            </Detail>
            <Detail label={t("fields.date")}>
              <DateCell value={order.date} withTime />
            </Detail>
            <Detail label={t("fields.status")}>
              <OrderStatusBadge status={order.status} />
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
          <DataTable<OrderLine>
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

      {/* Lifecycle confirms — explicit labels so the delete wording never leaks */}
      <ConfirmDialog
        open={lifecycleAction === "validate"}
        onClose={() => setLifecycleAction(null)}
        title={t("validateTitle")}
        entityName={order.code}
        description={t("validateConfirm")}
        confirmLabel={t("validate")}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={lifecycleAction === "ship"}
        onClose={() => setLifecycleAction(null)}
        title={t("shipTitle")}
        entityName={order.code}
        description={t("shipConfirm")}
        confirmLabel={t("ship")}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={lifecycleAction === "deliver"}
        onClose={() => setLifecycleAction(null)}
        title={t("deliverTitle")}
        entityName={order.code}
        description={t("deliverConfirm")}
        confirmLabel={t("deliver")}
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
  const { t } = useTranslation("customer-orders");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/customer-orders"
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
