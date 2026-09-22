import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toDashboardGraphs, toDashboardKpis } from "./mappers";
import { ArticlesApi } from "@/features/articles/api";
import { SalesApi } from "@/features/sales/api";
import type {
  CategoryStockValue,
  DashboardCharts,
  DashboardGraphs,
  DashboardKpis,
  DashboardKpisDTO,
  GraphiquesResponseDTO,
  SalesByDayPoint,
} from "../types";
import type { Article } from "@/features/articles/types";
import type { Sale } from "@/features/sales/types";

/**
 * 7-day sales series derived from real sales (VenteResponseDTO.dateVente +
 * .total). Buckets are LOCAL calendar days, today-6 … today, zero-filled so
 * quiet days still appear on the axis; labels are short French weekday names.
 */
export function buildSalesByDay(sales: Sale[]): SalesByDayPoint[] {
  const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
  const keyOf = (d: Date): string =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const buckets = new Map<string, number>();
  const days: SalesByDayPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.set(keyOf(d), 0);
    days.push({ label: dayFmt.format(d).replace(".", ""), total: 0 });
  }

  for (const sale of sales) {
    const d = new Date(sale.date);
    if (Number.isNaN(d.getTime())) continue;
    const total = buckets.get(keyOf(d));
    if (total !== undefined) {
      buckets.set(keyOf(d), total + (sale.total ?? 0));
    }
  }

  // Re-read the bucket totals in the same day order the labels were built in.
  return days.map((day, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return { ...day, total: buckets.get(keyOf(d)) ?? 0 };
  });
}

/**
 * Stock value per category, derived from real articles (ArticleResponseDTO:
 * stockActuel × prixUnitaireHt grouped by the nested categorie.designation).
 * Same HT formula as the backend's `valeurStock` KPI — the two stay coherent.
 */
export function buildStockValueByCategory(
  articles: Article[],
): CategoryStockValue[] {
  const sums = new Map<string, number>();
  for (const article of articles) {
    const name = article.category?.designation ?? "Sans catégorie";
    sums.set(
      name,
      (sums.get(name) ?? 0) + article.currentStock * article.unitPriceHt,
    );
  }
  return [...sums.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export const DashboardApi = {
  getKPIs: async (): Promise<DashboardKpis> => {
    const res = await apiClient.get<DashboardKpisDTO>(
      API_ENDPOINTS.DASHBOARD_KPIs,
    );
    return toDashboardKpis(res.data);
  },

  /**
   * GET /api/dashboard/graphiques — server-computed series: stock entries vs
   * exits per day, and the best-selling articles. Distinct from getCharts()
   * below, which derives revenue-per-day and stock-value-per-category
   * client-side because the contract exposes neither.
   */
  getGraphs: async (locale?: string): Promise<DashboardGraphs> => {
    const res = await apiClient.get<GraphiquesResponseDTO>(
      API_ENDPOINTS.DASHBOARD_CHARTS,
    );
    return toDashboardGraphs(res.data, locale);
  },

  /**
   * NOTE — swagger exposes no /dashboard/charts endpoint (verified against
   * the live backend too: the path would be a guaranteed 404). The two
   * dashboard charts are therefore composed client-side from REAL list
   * endpoints: sales for the 7-day series, articles for the stock-value
   * donut. If the backend ships a dedicated charts endpoint later, swap this
   * composition for the call and keep the DashboardCharts contract.
   */
  getCharts: async (): Promise<DashboardCharts> => {
    const [sales, articles] = await Promise.all([
      SalesApi.getAll(),
      ArticlesApi.getAll(),
    ]);
    return {
      salesByDay: buildSalesByDay(sales),
      stockValueByCategory: buildStockValueByCategory(articles),
    };
  },
};
