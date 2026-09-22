import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/feedback/FeedbackStates";
import { PanelHead } from "@/features/dashboard/components/PanelHead";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { langPath } from "@/lib/lang-path";
import { usePlatformStats } from "../hooks";
import type { RecentCompany } from "../types";

/**
 * Platform overview — the SUPER_ADMIN's landing page.
 *
 * Everything here is fleet-wide and comes from GET /api/plateforme/stats:
 * how many client companies exist, how many accounts they hold, and the
 * aggregate activity they generate. Nothing on this page belongs to a single
 * tenant — that is the company dashboard's job.
 */

/** Recently onboarded companies, newest first (the backend already sorts). */
function RecentlyOnboarded({
  companies,
  isPending,
}: {
  companies: RecentCompany[];
  isPending: boolean;
}) {
  const { t } = useTranslation("platform");

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <PanelHead title={t("recent.title")} to="/platform/companies" />

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-[54px] animate-pulse rounded-[11px] bg-surface-secondary"
            />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-content-muted">
          {t("recent.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {companies.slice(0, 5).map((company) => (
            <li key={company.id}>
              <Link
                to={langPath("/platform/companies")}
                className="flex items-center gap-3 rounded-[11px] px-[13px] py-[11px] transition-colors hover:bg-surface-hover"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-950 text-[12.5px] font-bold uppercase text-accent-400">
                  {company.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-content">
                    {company.name}
                  </p>
                  <p className="truncate text-xs text-content-muted">
                    {company.city || company.email || "—"}
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  {t("recent.accounts", { count: company.userCount })}
                </Badge>
                {company.createdAt && (
                  <span className="hidden shrink-0 text-xs text-content-muted sm:block">
                    {formatDate(company.createdAt)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One "fleet health" row: a label and a value chip. */
function HealthRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-success-700 dark:text-success-500"
      : tone === "warning"
        ? "text-warning-700 dark:text-warning-500"
        : "text-content-secondary";

  return (
    <div className="flex items-center justify-between rounded-[11px] bg-surface-secondary px-[13px] py-[11px]">
      <span className="min-w-0 truncate text-[13px] text-content-secondary">
        {label}
      </span>
      <span className={`shrink-0 font-mono text-[13px] font-bold ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

export const PlatformDashboardPage = () => {
  const { t } = useTranslation("platform");
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = usePlatformStats();

  if (isError) {
    return (
      <ErrorState
        message={t("error.message")}
        retryLabel={t("error.retry")}
        onRetry={() => void refetch()}
      />
    );
  }

  const stats = data;

  return (
    <div className="space-y-5">
      {/* Page head */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.13em] text-accent-600">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold text-content sm:text-[30px]">
            {t("title")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-content-muted">
            {t("subtitle")}
          </p>
        </div>

        <Button
          variant="gold"
          onClick={() => navigate(langPath("/platform/onboard"))}
          className="shrink-0 self-start"
        >
          <Plus className="h-4 w-4" />
          {t("onboard.cta")}
        </Button>
      </div>

      {/* Fleet KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          value={stats?.companyCount ?? 0}
          label={t("kpi.companies")}
          icon={Building2}
          tone="gold"
          trend={
            stats && stats.newCompaniesThisMonth > 0
              ? { direction: "up", value: `+${stats.newCompaniesThisMonth}` }
              : undefined
          }
        />
        <StatCard
          value={stats?.userCount ?? 0}
          label={t("kpi.users", { count: stats?.adminCount ?? 0 })}
          icon={Users}
          tone="info"
        />
        <StatCard
          value={stats?.customerCount ?? 0}
          label={t("kpi.customers")}
          icon={UserRound}
          tone="success"
        />
        <StatCard
          value={stats?.articleCount ?? 0}
          label={t("kpi.articles")}
          icon={Package}
          tone={stats && stats.articlesInAlert > 0 ? "danger" : "gold"}
          trend={
            stats && stats.articlesInAlert > 0
              ? { direction: "down", value: String(stats.articlesInAlert) }
              : undefined
          }
        />
      </div>

      {/* Activity KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          value={stats?.revenueThisMonth ?? 0}
          label={t("kpi.revenue")}
          icon={ShoppingCart}
          tone="gold"
        />
        <StatCard
          value={stats?.salesThisMonth ?? 0}
          label={t("kpi.sales", { total: stats?.saleCount ?? 0 })}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          value={stats?.ordersInProgress ?? 0}
          label={t("kpi.orders")}
          icon={ClipboardList}
          tone="info"
        />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentlyOnboarded
          companies={stats?.recentCompanies ?? []}
          isPending={isPending}
        />

        <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
          <PanelHead title={t("health.title")} />
          <p className="mb-4 text-[13px] leading-relaxed text-content-muted">
            {t("health.hint")}
          </p>
          <div className="space-y-2">
            <HealthRow
              label={t("health.newThisMonth")}
              value={`+${stats?.newCompaniesThisMonth ?? 0}`}
              tone={
                stats && stats.newCompaniesThisMonth > 0
                  ? "positive"
                  : "neutral"
              }
            />
            <HealthRow
              label={t("health.admins")}
              value={String(stats?.adminCount ?? 0)}
            />
            <HealthRow
              label={t("health.revenue")}
              value={formatCurrency(stats?.revenueThisMonth ?? 0, CURRENCY)}
            />
            <HealthRow
              label={t("health.alerts")}
              value={String(stats?.articlesInAlert ?? 0)}
              tone={stats && stats.articlesInAlert > 0 ? "warning" : "neutral"}
            />
          </div>

          {stats && stats.articlesInAlert > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-[11px] bg-warning-100 px-[13px] py-[11px] text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-500">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {t("health.alertsHint", { count: stats.articlesInAlert })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
