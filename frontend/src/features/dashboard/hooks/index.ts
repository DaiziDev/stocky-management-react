import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DashboardApi } from "../api";

/** Query-key factory for dashboard queries. */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  kpis: () => [...dashboardKeys.all, "kpis"] as const,
  charts: () => [...dashboardKeys.all, "charts"] as const,
  graphs: (locale: string) => [...dashboardKeys.all, "graphs", locale] as const,
};

export const useDashboardKPIs = () => {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: () => DashboardApi.getKPIs(),
  });
};

/**
 * GET /api/dashboard/graphiques. Keyed by language because the mapper builds
 * localized axis labels, so switching fr↔en must produce a fresh series
 * rather than reuse the previous locale's labels.
 */
export const useDashboardGraphs = () => {
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: dashboardKeys.graphs(i18n.language),
    queryFn: () => DashboardApi.getGraphs(i18n.language),
  });
};

export const useDashboardCharts = () => {
  return useQuery({
    queryKey: dashboardKeys.charts(),
    queryFn: () => DashboardApi.getCharts(),
  });
};
