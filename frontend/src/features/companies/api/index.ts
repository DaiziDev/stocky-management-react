import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  toCompany,
  toEntrepriseRequest,
  toEntrepriseUpdateRequest,
} from "./mappers";
import type {
  Company,
  CompanyContactWrite,
  CompanyWrite,
  EntrepriseResponseDTO,
} from "../types";

/**
 * Companies API — pinned to swagger.json (backend resource: «entreprises»):
 *
 *   GET    /api/entreprises        → EntrepriseResponseDTO[] (bare array)
 *   POST   /api/entreprises        → EntrepriseResponseDTO
 *   GET    /api/entreprises/{id}   → EntrepriseResponseDTO
 *   PUT    /api/entreprises/{id}   → EntrepriseResponseDTO
 *   DELETE /api/entreprises/{id}
 *
 * Every method returns the domain `Company`, never raw DTOs — responses are
 * mapped (int64 id → string) and unwrapped from the Axios envelope here.
 */
export const CompaniesApi = {
  /** No query params in swagger v1.0 — the backend returns every company (bare array). */
  getAll: async (): Promise<Company[]> => {
    const res = await apiClient.get<EntrepriseResponseDTO[]>(
      API_ENDPOINTS.COMPANIES,
    );
    return res.data.map(toCompany);
  },

  getById: async (id: string): Promise<Company> => {
    const res = await apiClient.get<EntrepriseResponseDTO>(
      API_ENDPOINTS.COMPANY(id),
    );
    return toCompany(res.data);
  },

  /** Creates a company WITHOUT an admin account — platform onboarding
   * (features/platform) is the flow that creates both in one transaction. */
  create: async (data: CompanyWrite): Promise<Company> => {
    const res = await apiClient.post<EntrepriseResponseDTO>(
      API_ENDPOINTS.COMPANIES,
      toEntrepriseRequest(data),
    );
    return toCompany(res.data);
  },

  /**
   * PUT /api/entreprises/{id} — contact details only. Swagger is explicit
   * that the name is the tenant partitioning key and is not editable, so the
   * body is an `EntrepriseUpdateDTO` and never carries `nom`.
   */
  update: async (id: string, data: CompanyContactWrite): Promise<Company> => {
    const res = await apiClient.put<EntrepriseResponseDTO>(
      API_ENDPOINTS.COMPANY(id),
      toEntrepriseUpdateRequest(data),
    );
    return toCompany(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.COMPANY(id));
  },
};
