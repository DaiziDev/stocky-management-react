import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { useDashboardKPIs } from "../hooks";
import { SalesChartCard } from "../components/SalesChartCard";
import { CategoryDonutCard } from "../components/CategoryDonutCard";
import { StockFlowChartCard } from "../components/StockFlowChartCard";
import { TopArticlesCard } from "../components/TopArticlesCard";
import { PanelHead } from "../components/PanelHead";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/feedback/FeedbackStates";
import { useStockAlertes } from "@/features/stock/hooks";
import { useCustomerOrders } from "@/features/customer-orders/hooks";
import { currencySymbol, formatDate } from "@/lib/utils";
import { langPath } from "@/lib/lang-path";
import { useAuthStore } from "@/stores/auth.store";
import { OrderStatusBadge } from "@/features/customer-orders/components/OrderStatusBadge";

const STAGGER_DELAYS = ["0s", "0.06s", "0.12s", "0.18s"] as const;

/** Mockup .alert-row — tinted row, severity bar, mono stock/min ratio. */
const StockAlertsPanel = () => {
  const { t } = useTranslation("dashboard");
  // Domain hook returns mapped StockRow[] (designation, currentStock, minThreshold).
  const { data, isPending } = useStockAlertes();
  const alerts = data ?? [];

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <PanelHead title={t("stockAlerts.title")} to="/stock/alerts" />

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-[62px] animate-pulse rounded-[11px] bg-surface-secondary"
            />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-content-muted">
          {t("stockAlerts.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 5).map((alert) => {
            const out = alert.currentStock <= 0;
            const tone = out
              ? {
                  row: "bg-danger-100 dark:bg-danger-500/10",
                  bar: "bg-danger-500",
                  track: "bg-danger-500/20 dark:bg-danger-500/25",
                  value: "text-danger-700 dark:text-danger-500",
                }
              : {
                  row: "bg-warning-100 dark:bg-warning-500/10",
                  bar: "bg-warning-500",
                  track: "bg-warning-500/20 dark:bg-warning-500/25",
                  value: "text-warning-700 dark:text-warning-500",
                };
            const ratio = Math.min(
              100,
              Math.round(
                (alert.currentStock / Math.max(alert.minThreshold, 1)) * 100,
              ),
            );

            return (
              <li key={alert.articleId}>
                <Link
                  to={langPath(`/catalog/articles/${alert.articleId}`)}
                  className={`flex items-center gap-3 rounded-[11px] px-[13px] py-[11px] transition-transform hover:translate-x-0.5 ${tone.row}`}
                >
                  <AlertTriangle
                    className={`h-[17px] w-[17px] shrink-0 ${tone.value}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-content">
                      {alert.designation}
                    </p>
                    <div
                      className={`mt-1.5 h-1 overflow-hidden rounded-full ${tone.track}`}
                    >
                      <div
                        className={`h-full rounded-full ${tone.bar}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[11.5px] font-bold ${tone.value}`}
                  >
                    {alert.currentStock}/{alert.minThreshold}
                  </span>
                  <Badge variant={out ? "danger" : "warning"} size="sm">
                    {out ? t("stockAlerts.critical") : t("stockAlerts.low")}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/** Recent customer orders — live from the orders feature (max 5). */
const RecentOrdersPanel = () => {
  const { t } = useTranslation("dashboard");
  const { data, isPending } = useCustomerOrders();
  const orders = (data ?? []).slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <PanelHead title={t("recentOrders.title")} to="/customer-orders" />

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-[54px] animate-pulse rounded-[11px] bg-surface-secondary"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-content-muted">
          {t("recentOrders.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={langPath(`/customer-orders/${order.id}`)}
                className="flex items-center gap-3 rounded-[11px] px-[13px] py-[11px] transition-colors hover:bg-surface-hover"
              >
                <ShoppingCart
                  className="h-4 w-4 shrink-0 text-content-muted"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] font-medium text-content">
                    {order.code}
                  </p>
                  <p className="truncate text-xs text-content-muted">
                    {order.customerName} · {formatDate(order.date)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * DashboardPage — KPI grid from the real `DashboardKpisDTO` (via
 * useDashboardKPIs), then live panels from the feature queries:
 * sales chart + recent orders, category donut + stock alerts.
 * (The aspirational recent-sales/top-articles panels from the old
 * common.types contract have no backend fields — dropped.)
 */
export const DashboardPage = () => {
  const { t } = useTranslation("dashboard");
  const { data: kpis, isPending, isError, refetch } = useDashboardKPIs();
  // The tenant the session belongs to, named in the subtitle like the mockup.
  const companyName = useAuthStore((s) => s.user?.companyName);

  return (
    <div className="space-y-5">
      {/* Page head */}
      <div>
        <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-accent-600">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1.5 font-display text-[30px] font-semibold text-content">
          {t("title")}
        </h1>
        <p className="mt-1.5 text-sm text-content-muted">
          {companyName
            ? t("subtitleFor", { company: companyName })
            : t("subtitle")}
        </p>
      </div>

      {/* KPI grid */}
      {isPending && (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 dash:grid-cols-4">
          {STAGGER_DELAYS.map((delay) => (
            <StatCardSkeleton key={delay} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          title={t("kpiError.title")}
          message={t("kpiError.message")}
          onRetry={() => refetch()}
        />
      )}

      {kpis && (
        <>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 dash:grid-cols-4">
            <div
              className="rise-in"
              style={{ animationDelay: STAGGER_DELAYS[0] }}
            >
              <StatCard
                value={kpis.customerOrdersInProgress}
                label={t("kpi.ordersInProgress")}
                icon={ShoppingCart}
                tone="info"
              />
            </div>
            <div
              className="rise-in"
              style={{ animationDelay: STAGGER_DELAYS[1] }}
            >
              <StatCard
                value={kpis.revenueThisMonth}
                suffix={currencySymbol()}
                label={t("kpi.revenueThisMonth")}
                icon={TrendingUp}
                tone="success"
              />
            </div>
            <div
              className="rise-in"
              style={{ animationDelay: STAGGER_DELAYS[2] }}
            >
              <StatCard
                value={kpis.supplierOrdersPending}
                label={t("kpi.supplyPending")}
                icon={Package}
                tone="gold"
              />
            </div>
            <div
              className="rise-in"
              style={{ animationDelay: STAGGER_DELAYS[3] }}
            >
              <StatCard
                value={kpis.alertCount}
                label={t("kpi.articlesInAlert")}
                icon={AlertTriangle}
                tone="danger"
              />
            </div>
          </div>

          {/* dash-grid row 1: sales chart (1.4fr) + recent orders (1fr) */}
          <div className="grid grid-cols-1 gap-5 dash:grid-cols-[1.4fr_1fr]">
            <div className="rise-in" style={{ animationDelay: "0.26s" }}>
              <SalesChartCard />
            </div>
            <div className="rise-in" style={{ animationDelay: "0.32s" }}>
              <RecentOrdersPanel />
            </div>
          </div>

          {/* dash-grid row 2: category donut (1.4fr) + alerts (1fr) */}
          <div className="grid grid-cols-1 gap-5 dash:grid-cols-[1.4fr_1fr]">
            <div className="rise-in" style={{ animationDelay: "0.38s" }}>
              <CategoryDonutCard />
            </div>
            <div className="rise-in" style={{ animationDelay: "0.44s" }}>
              <StockAlertsPanel />
            </div>
          </div>

          {/* dash-grid row 3: server-computed series from /dashboard/graphiques */}
          <div className="grid grid-cols-1 gap-5 dash:grid-cols-[1.4fr_1fr]">
            <div className="rise-in" style={{ animationDelay: "0.50s" }}>
              <StockFlowChartCard />
            </div>
            <div className="rise-in" style={{ animationDelay: "0.56s" }}>
              <TopArticlesCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** KPI card skeleton (same geometry as StatCard). */
function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
      <div className="mt-3 h-8 w-32 animate-pulse rounded bg-surface-secondary" />
    </div>
  );
}
