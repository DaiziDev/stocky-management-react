import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toCategory } from "./mappers";
import type { Category, CategorieResponseDTO } from "../types";

/**
 * Categories API — pinned to swagger.json (reference implementation for P0.2):
 *
 *   GET    /api/categories            → CategorieResponseDTO[]
 *   POST   /api/categories            → CategorieResponseDTO
 *   GET    /api/categories/{id}       → CategorieResponseDTO
 *   PUT    /api/categories/{id}       → CategorieResponseDTO
 *   DELETE /api/categories/{id}       → 204
 *
 * Every method returns the domain `Category`, never raw DTOs: responses are
 * mapped (int64 id → string) and unwrapped from the Axios envelope here, so
 * hooks and components consume plain data. Delete returns void.
 */
export const CategoriesApi = {
  /** No query params in swagger v1.0 — the backend returns every category (bare array). */
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get<CategorieResponseDTO[]>(
      API_ENDPOINTS.CATEGORIES,
    );
    return res.data.map(toCategory);
  },

  getById: async (id: string): Promise<Category> => {
    const res = await apiClient.get<CategorieResponseDTO>(
      API_ENDPOINTS.CATEGORY(id),
    );
    return toCategory(res.data);
  },

  create: async (data: {
    code: string;
    designation: string;
  }): Promise<Category> => {
    const res = await apiClient.post<CategorieResponseDTO>(
      API_ENDPOINTS.CATEGORIES,
      data,
    );
    return toCategory(res.data);
  },

  update: async (
    id: string,
    data: { code: string; designation: string },
  ): Promise<Category> => {
    const res = await apiClient.put<CategorieResponseDTO>(
      API_ENDPOINTS.CATEGORY(id),
      data,
    );
    return toCategory(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CATEGORY(id));
  },
};
