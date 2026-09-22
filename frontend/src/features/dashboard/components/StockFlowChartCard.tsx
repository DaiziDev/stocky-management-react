import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelHead } from "./PanelHead";
import { SalesChartSkeleton } from "./ChartSkeletons";
import { useDashboardGraphs } from "../hooks";
import { chartColors } from "@/lib/chart-colors";

/**
 * «Entrées / sorties de stock» — the `evolutionStock` series from
 * GET /api/dashboard/graphiques.
 *
 * Grouped bars rather than an area chart: entries and exits are two
 * independent counts per day, and stacking or filling them would suggest a
 * cumulative relationship that does not exist.
 */
export const StockFlowChartCard = () => {
  const { t } = useTranslation("dashboard");
  const { data, isPending } = useDashboardGraphs();

  const series = data?.stockFlow ?? [];

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <PanelHead title={t("stockFlow.title")} to="/stock/movements" />

      {isPending ? (
        <SalesChartSkeleton />
      ) : series.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-[13px] text-content-muted">
          {t("stockFlow.empty")}
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.tick, fontSize: 11.5 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fill: chartColors.tick, fontSize: 11.5 }}
              />
              <Tooltip
                cursor={{ fill: chartColors.cursor }}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 11,
                  fontSize: 12.5,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar
                dataKey="entries"
                name={t("stockFlow.entries")}
                fill={chartColors.green}
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="exits"
                name={t("stockFlow.exits")}
                fill={chartColors.gold}
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
