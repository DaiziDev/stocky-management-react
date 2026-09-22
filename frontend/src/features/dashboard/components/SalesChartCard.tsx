import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelHead } from "./PanelHead";
import { useDashboardCharts } from "../hooks";
import { SalesChartSkeleton } from "./ChartSkeletons";
import { formatCurrency } from "@/lib/utils";
import { chartColors } from "@/lib/chart-colors";

/* Mockup §view-dashboard "Ventes des 7 derniers jours" — dash-grid 1.4fr
   column. Area chart, brand gold stroke via --color-accent-500 (theme-aware
   — tokens.css overrides it in dark), soft grid, mono tooltip. */

export const SalesChartCard = () => {
  const { t } = useTranslation("dashboard");
  const { data, isPending } = useDashboardCharts();

  const series = data?.salesByDay ?? [];

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <PanelHead
        title={t("salesChart.title")}
        to="/sales"
        linkLabel={t("salesChart.posLink")}
      />

      {isPending ? (
        <SalesChartSkeleton />
      ) : series.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-[13px] text-content-muted">
          {t("salesChart.empty")}
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={chartColors.gold}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={chartColors.gold}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.tick, fontSize: 11 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.tick, fontSize: 11 }}
                tickFormatter={(value: number) => `${value / 1000}k`}
                width={38}
              />
              <Tooltip
                cursor={{ stroke: chartColors.cursor, strokeWidth: 24 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0];
                  return (
                    <div className="rounded-[9px] border border-border bg-surface px-3 py-2 shadow-sm">
                      <p className="text-[12px] font-medium text-content">
                        {point.payload.label}
                      </p>
                      <p className="font-mono text-[11.5px] text-content-muted">
                        {formatCurrency(point.value as number)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={chartColors.gold}
                strokeWidth={2}
                fill="url(#sales-fill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-surface)",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
