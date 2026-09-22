import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toFournisseurRequest, toSupplier } from "./mappers";
import type { FournisseurResponseDTO, Supplier, SupplierWrite } from "../types";

/**
 * Suppliers API — pinned to swagger.json (backend resource: «fournisseurs»):
 *
 *   GET    /api/fournisseurs        → FournisseurResponseDTO[] (bare array)
 *   POST   /api/fournisseurs        → FournisseurResponseDTO
 *   GET    /api/fournisseurs/{id}   → FournisseurResponseDTO
 *   PUT    /api/fournisseurs/{id}   → FournisseurResponseDTO
 *   DELETE /api/fournisseurs/{id}
 *
 * Every method returns the domain `Supplier`, never raw DTOs — responses are
 * mapped (int64 id → string) and unwrapped from the Axios envelope here.
 */
export const SuppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const res = await apiClient.get<FournisseurResponseDTO[]>(
      API_ENDPOINTS.SUPPLIERS,
    );
    return res.data.map(toSupplier);
  },

  getById: async (id: string): Promise<Supplier> => {
    const res = await apiClient.get<FournisseurResponseDTO>(
      API_ENDPOINTS.SUPPLIER(id),
    );
    return toSupplier(res.data);
  },

  create: async (input: SupplierWrite): Promise<Supplier> => {
    const res = await apiClient.post<FournisseurResponseDTO>(
      API_ENDPOINTS.SUPPLIERS,
      toFournisseurRequest(input),
    );
    return toSupplier(res.data);
  },

  update: async (id: string, input: SupplierWrite): Promise<Supplier> => {
    const res = await apiClient.put<FournisseurResponseDTO>(
      API_ENDPOINTS.SUPPLIER(id),
      toFournisseurRequest(input),
    );
    return toSupplier(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SUPPLIER(id));
  },
};
