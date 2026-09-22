/**
 * Dashboard — real shapes pinned from swagger.json (roadmap P0.2 / re-sync).
 *
 * Backend contract:
 *   GET /api/dashboard/kpis → DashboardKpisDTO
 *   GET /dashboard/charts   → NOT pinned in swagger v1.0; the frontend
 *     contract (DashboardCharts) is kept and normalized in api/index.ts —
 *     reconcile when the backend ships the endpoint.
 */

/** Raw response of GET /api/dashboard/kpis — swagger `DashboardKpisDTO`. */
export interface DashboardKpisDTO {
  /** Total stock value (HT × qty, all articles). */
  valeurStock: number;
  /** Articles at or below their minimum threshold. */
  nbArticlesEnAlerte: number;
  /** Customer orders currently EN_COURS. */
  nbCommandesClientEnCours: number;
  /** Supplier orders currently EN_ATTENTE. */
  nbCommandesFournisseurEnAttente: number;
  /** Sales recorded this month. */
  nbVentesDuMois: number;
  /** Revenue (HT) for the current month. */
  chiffreAffairesDuMois: number;
}

/**
 * Domain KPIs — mapped from `DashboardKpisDTO` in ../api/mappers.ts.
 * Type alias (not interface) for consistency with the other feature models.
 *
 * The swagger DTO has NO revenue-last-month, recent-orders, top-articles or
 * recent-sales fields — those aspirational panels now read live feature
 * queries instead (useCustomerOrders, useArticles, useSales).
 */
export type DashboardKpis = {
  /** `valeurStock`. */
  stockValue: number;
  /** `nbArticlesEnAlerte`. */
  alertCount: number;
  /** `nbCommandesClientEnCours`. */
  customerOrdersInProgress: number;
  /** `nbCommandesFournisseurEnAttente`. */
  supplierOrdersPending: number;
  /** `nbVentesDuMois`. */
  salesThisMonth: number;
  /** `chiffreAffairesDuMois`. */
  revenueThisMonth: number;
};

/** Point of the 7-day sales series (mockup « Ventes des 7 derniers jours »). */
export interface SalesByDayPoint {
  /** X-axis label (e.g. "lun."). Generated client-side when the backend sends bare numbers. */
  label: string;
  /** Total sales amount for the day. */
  total: number;
}

/** Stock-value slice per category (mockup « Valeur du stock par catégorie »). */
export interface CategoryStockValue {
  name: string;
  value: number;
}

/**
 * GET /dashboard/charts response.
 * The endpoint is not yet pinned in swagger.json — the API layer normalizes
 * the payload onto this contract (single mapping point, see api/index.ts).
 */
export interface DashboardCharts {
  salesByDay: SalesByDayPoint[];
  stockValueByCategory: CategoryStockValue[];
}

/* ------------------------------------------------------------------ */
/* GET /api/dashboard/graphiques — server-computed series              */
/* ------------------------------------------------------------------ */

/** One day of the stock-flow series — swagger `EntreeSortieJourDTO`. */
export interface EntreeSortieJourDTO {
  /** ISO date (yyyy-MM-dd). */
  date?: string;
  entrees?: number;
  sorties?: number;
}

/** A best-selling article — swagger `TopArticleDTO`. */
export interface TopArticleDTO {
  articleId?: number;
  designation?: string;
  codeArticle?: string;
  quantiteVendue?: number;
  chiffreAffaires?: number;
}

/** Raw response of GET /api/dashboard/graphiques — `GraphiquesResponseDTO`. */
export interface GraphiquesResponseDTO {
  evolutionStock?: EntreeSortieJourDTO[];
  topArticles?: TopArticleDTO[];
}

/** One point of the stock-flow chart, with a localized axis label. */
export type StockFlowPoint = {
  /** Raw ISO date, kept for sorting and tooltips. */
  date: string;
  /** Short weekday/day label for the X axis. */
  label: string;
  entries: number;
  exits: number;
};

/** Domain model for a best-selling article. */
export type TopArticle = {
  /** int64 in swagger; kept as string domain-wide. */
  id: string;
  code: string;
  designation: string;
  quantitySold: number;
  revenue: number;
};

/** Domain model for GET /api/dashboard/graphiques. */
export type DashboardGraphs = {
  stockFlow: StockFlowPoint[];
  topArticles: TopArticle[];
};
