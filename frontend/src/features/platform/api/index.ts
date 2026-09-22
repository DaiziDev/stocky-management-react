import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import { toCompany } from "@/features/companies/api/mappers";
import type {
  Company,
  EntrepriseResponseDTO,
} from "@/features/companies/types";
import { toAdminEntrepriseRequest, toPlatformStats } from "./mappers";
import type {
  CompanyOnboarding,
  PlateformeStatsDTO,
  PlatformStats,
} from "../types";

/**
 * Platform API — pinned to swagger.json (tag «🛰️ Plateforme»):
 *
 *   GET  /api/plateforme/stats       → PlateformeStatsDTO
 *   POST /api/plateforme/entreprises → EntrepriseResponseDTO
 *
 * Both are SUPER_ADMIN-only server-side; the client mirrors that with a
 * RoleRoute plus an in-page re-check (deep-link defense).
 */
export const PlatformApi = {
  getStats: async (): Promise<PlatformStats> => {
    const res = await apiClient.get<PlateformeStatsDTO>(
      API_ENDPOINTS.PLATFORM.STATS,
    );
    return toPlatformStats(res.data);
  },

  /**
   * Onboard a client company: creates the company AND its first ADMIN account
   * in one backend transaction, so the credentials entered here are
   * immediately usable to log into that company's own dashboard.
   */
  onboard: async (input: CompanyOnboarding): Promise<Company> => {
    const res = await apiClient.post<EntrepriseResponseDTO>(
      API_ENDPOINTS.PLATFORM.ONBOARD,
      toAdminEntrepriseRequest(input),
    );
    return toCompany(res.data);
  },
};
