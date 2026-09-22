import type {
  DashboardGraphs,
  DashboardKpis,
  DashboardKpisDTO,
  EntreeSortieJourDTO,
  GraphiquesResponseDTO,
} from "../types";

/** `DashboardKpisDTO` → `DashboardKpis` (French wire names → domain names). */
export function toDashboardKpis(dto: DashboardKpisDTO): DashboardKpis {
  return {
    stockValue: dto.valeurStock ?? 0,
    alertCount: dto.nbArticlesEnAlerte ?? 0,
    customerOrdersInProgress: dto.nbCommandesClientEnCours ?? 0,
    supplierOrdersPending: dto.nbCommandesFournisseurEnAttente ?? 0,
    salesThisMonth: dto.nbVentesDuMois ?? 0,
    revenueThisMonth: dto.chiffreAffairesDuMois ?? 0,
  };
}

/**
 * `GraphiquesResponseDTO` → `DashboardGraphs`.
 *
 * Unlike the client-derived charts in ./index.ts, this series is computed by
 * the backend, so the mapper only normalizes names, defaults missing counters
 * to 0 and adds the localized axis label the chart needs.
 */
export function toDashboardGraphs(
  dto: GraphiquesResponseDTO,
  locale = "fr-FR",
): DashboardGraphs {
  const dayLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
  });

  return {
    stockFlow: (dto.evolutionStock ?? [])
      .filter((point): point is EntreeSortieJourDTO & { date: string } =>
        Boolean(point.date),
      )
      .map((point) => ({
        date: point.date,
        label: dayLabel.format(new Date(point.date)),
        entries: point.entrees ?? 0,
        exits: point.sorties ?? 0,
      })),
    topArticles: (dto.topArticles ?? []).map((article) => ({
      id: String(article.articleId ?? ""),
      code: article.codeArticle ?? "",
      designation: article.designation ?? "",
      quantitySold: article.quantiteVendue ?? 0,
      revenue: article.chiffreAffaires ?? 0,
    })),
  };
}
