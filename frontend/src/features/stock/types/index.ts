/**
 * Stock — real shapes pinned from swagger.json (roadmap P0.2 / P5.1–5.3).
 *
 * Backend resources (all French, all read-only except manual adjustments):
 *   GET  /api/stock/etat        → ArticleStockDTO[]   (current stock per article)
 *   GET  /api/stock/alertes     → ArticleStockDTO[]   (stock ≤ seuilMin)
 *   GET  /api/stock/valorisation → ValorisationResponseDTO (total value, HT × qty)
 *   GET  /api/mouvements-stock  → MvtStkResponseDTO[] (filterable: articleId, type)
 *   POST /api/mouvements-stock  → MvtStkResponseDTO   (manual adjustment, signed qty + required motif)
 *
 * Note: /stock/etat carries no unit price — the "unit value" column the
 * roadmap wanted is not available; valorisation is the only server-side
 * money figure. `origine` labels what generated a movement (order/sale/...).
 */

export type StockMovementType = "ENTREE" | "SORTIE" | "AJUSTEMENT";

/** Response of /api/stock/etat and /api/stock/alertes — swagger `ArticleStockDTO`. */
export interface ArticleStockDTO {
  articleId: number;
  codeArticle: string;
  designation: string;
  stockActuel: number;
  seuilMin: number;
}

/** Response of /api/stock/valorisation — swagger `ValorisationResponseDTO`. */
export interface ValorisationResponseDTO {
  valeurTotale: number;
}

/** Response of GET/POST /api/mouvements-stock — swagger `MvtStkResponseDTO`. */
export interface MvtStkResponseDTO {
  id: number;
  type: StockMovementType;
  quantite: number;
  /** ISO date-time. */
  dateMouvement: string;
  motif: string;
  origine?: string;
  articleId: number;
  articleDesignation: string;
  stockActuelApres: number;
}

/** Body of POST /api/mouvements-stock — swagger `MvtStkRequestDTO` (signed quantity). */
export interface MvtStkRequestDTO {
  articleId: number;
  quantite: number;
  motif: string;
}

/**
 * Domain rows — mapped in ../api/mappers.ts.
 * Type aliases (not interfaces) for TanStack Table v9's `RowData` constraint.
 */
export type StockRow = {
  articleId: string;
  code: string;
  designation: string;
  currentStock: number;
  minThreshold: number;
};

export type StockMovement = {
  id: string;
  type: StockMovementType;
  /** Signed quantity for AJUSTEMENT (+/-); positive for ENTREE/SORTIE. */
  quantity: number;
  date: string;
  reason: string;
  /** What generated the movement (order code, sale, manual…). */
  origin: string | null;
  articleId: string;
  articleDesignation: string;
  stockAfter: number;
};

/** Manual-adjustment payload (POST /api/mouvements-stock). */
export type StockAdjustmentInput = {
  articleId: string;
  /** Signed quantity (+/-). */
  quantity: number;
  reason: string;
};
