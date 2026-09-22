import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  toStockMovement,
  toStockRow,
  toValorisation,
  toMvtStkRequest,
} from "./mappers";
import type {
  ArticleStockDTO,
  MvtStkResponseDTO,
  StockAdjustmentInput,
  StockMovement,
  StockMovementType,
  StockRow,
} from "../types";

/**
 * Stock API — pinned to swagger.json (backend resources «stock» + «mouvements-stock»):
 *
 *   GET  /api/stock/etat        → ArticleStockDTO[]           (bare array, read-only)
 *   GET  /api/stock/alertes     → ArticleStockDTO[]           (stock ≤ seuilMin)
 *   GET  /api/stock/valorisation → ValorisationResponseDTO
 *   GET  /api/mouvements-stock  → MvtStkResponseDTO[]         (query: articleId, type)
 *   POST /api/mouvements-stock  → MvtStkResponseDTO           (manual adjustment: signed qty + required motif)
 *
 * Every method returns domain types, never raw DTOs.
 */
export const StockApi = {
  /** Current stock per article. */
  getEtat: async (): Promise<StockRow[]> => {
    const res = await apiClient.get<ArticleStockDTO[]>(
      API_ENDPOINTS.STOCK.ETAT,
    );
    return res.data.map(toStockRow);
  },

  /** Articles at or below their minimum threshold. */
  getAlertes: async (): Promise<StockRow[]> => {
    const res = await apiClient.get<ArticleStockDTO[]>(
      API_ENDPOINTS.STOCK.ALERTS,
    );
    return res.data.map(toStockRow);
  },

  /** Total stock value (HT × quantity, all articles). */
  getValorisation: async (): Promise<number> => {
    const res = await apiClient.get<{ valeurTotale: number }>(
      API_ENDPOINTS.STOCK.VALUATION,
    );
    return toValorisation(res.data);
  },

  /** Movements ledger — filterable by article and/or type (ENTREE/SORTIE/AJUSTEMENT). */
  getMovements: async (filters?: {
    articleId?: string;
    type?: StockMovementType;
  }): Promise<StockMovement[]> => {
    const params: Record<string, string> = {};
    if (filters?.articleId) params.articleId = filters.articleId;
    if (filters?.type) params.type = filters.type;
    const res = await apiClient.get<MvtStkResponseDTO[]>(
      API_ENDPOINTS.STOCK.MOVEMENTS,
      { params },
    );
    return res.data.map(toStockMovement);
  },

  /** Manual inventory correction — signed quantity, motif mandatory (backend-enforced). */
  createAdjustment: async (
    input: StockAdjustmentInput,
  ): Promise<StockMovement> => {
    const res = await apiClient.post<MvtStkResponseDTO>(
      API_ENDPOINTS.STOCK.MOVEMENTS,
      toMvtStkRequest(input),
    );
    return toStockMovement(res.data);
  },
};
