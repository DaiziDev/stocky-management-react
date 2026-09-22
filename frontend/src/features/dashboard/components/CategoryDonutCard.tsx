import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { PanelHead } from "./PanelHead";
import { formatCurrency } from "@/lib/utils";
import { useDashboardCharts } from "../hooks";
import { DonutChartSkeleton } from "./ChartSkeletons";
import { donutPalette } from "@/lib/chart-colors";

/* Mockup §view-dashboard "Valeur du stock par catégorie" — dash-grid 1.4fr
   column. Donut with token-based brand palette (theme-aware via CSS vars —
   tokens.css overrides accent/primary in dark), center total, mono legend.
   Charts stay recharts per audit §23. */

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  return (
    <div className="rounded-[9px] border border-border bg-surface px-3 py-2 shadow-sm">
      <p className="text-[12px] font-medium text-content">{slice.name}</p>
      <p className="font-mono text-[11.5px] text-content-muted">
        {formatCurrency(slice.value)}
      </p>
    </div>
  );
};

export const CategoryDonutCard = () => {
  const { t } = useTranslation("dashboard");
  const { data, isPending } = useDashboardCharts();

  const slices = data?.stockValueByCategory ?? [];
  const colors = donutPalette;
  const total = slices.reduce(
    (sum: number, slice: { value: number }) => sum + slice.value,
    0,
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <PanelHead title={t("stockDonut.title")} to="/catalog/articles" />

      {isPending ? (
        <DonutChartSkeleton />
      ) : slices.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-[13px] text-content-muted">
          {t("stockDonut.empty")}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 lg:flex-row">
          {/* Donut + center total */}
          <div className="relative h-[220px] w-[220px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DonutTooltip />} />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="98%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {slices.map((slice: { name: string }, index: number) => (
                    <Cell
                      key={slice.name}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10.5px] uppercase tracking-[0.13em] text-content-muted">
                {t("stockDonut.totalLabel")}
              </span>
              <span className="font-mono text-lg font-semibold text-content">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Mono legend */}
          <ul className="w-full min-w-0 space-y-2">
            {slices.map(
              (slice: { name: string; value: number }, index: number) => (
                <li key={slice.name} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={{ background: colors[index % colors.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-content-secondary">
                    {slice.name}
                  </span>
                  <span className="font-mono text-[11.5px] text-content-muted">
                    {formatCurrency(slice.value)}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
