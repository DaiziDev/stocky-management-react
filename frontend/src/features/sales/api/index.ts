import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toSale, toVenteRequest } from "./mappers";
import type { Sale, SaleWrite, VenteResponseDTO } from "../types";

/**
 * Sales API — pinned to swagger.json (backend resource: «ventes», the POS):
 *
 *   GET  /api/ventes        → VenteResponseDTO[] (bare array)
 *   POST /api/ventes        → VenteResponseDTO  (checkout: decrements stock server-side,
 *                                                 409 if stock insufficient for any line)
 *   GET  /api/ventes/{id}   → VenteResponseDTO
 *
 * NOTE: no PUT/DELETE — sales are immutable once created. Every method
 * returns the domain `Sale`, never raw DTOs.
 */
export const SalesApi = {
  getAll: async (): Promise<Sale[]> => {
    const res = await apiClient.get<VenteResponseDTO[]>(API_ENDPOINTS.SALES);
    return res.data.map(toSale);
  },

  getById: async (id: string): Promise<Sale> => {
    const res = await apiClient.get<VenteResponseDTO>(API_ENDPOINTS.SALE(id));
    return toSale(res.data);
  },

  /** Checkout — sale + cart lines in one request; server decrements stock atomically. */
  checkout: async (input: SaleWrite): Promise<Sale> => {
    const res = await apiClient.post<VenteResponseDTO>(
      API_ENDPOINTS.SALES,
      toVenteRequest(input),
    );
    return toSale(res.data);
  },
};
