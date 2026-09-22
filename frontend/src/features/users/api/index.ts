import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  toRegisterRequest,
  toUserRecord,
  toUserRecordFromUserInfo,
  toUtilisateurUpdateRequest,
} from "./mappers";
import type {
  UserCreateInput,
  UserRecord,
  UserUpdateInput,
  UtilisateurResponseDTO,
} from "../types";
import type { AuthTokensDTO } from "@/features/auth/types";

/**
 * Users API — pinned to swagger.json (backend resources: «utilisateurs» + auth):
 *
 *   GET    /api/utilisateurs       → UtilisateurResponseDTO[] (bare array, scoped to the admin's company)
 *   PUT    /api/utilisateurs/{id}  → UtilisateurResponseDTO   (no login/password change)
 *   DELETE /api/utilisateurs/{id}
 *   POST   /api/auth/register      → LoginResponse            (ADMIN-only creation)
 *
 * Every method returns the domain `UserRecord`, never raw DTOs — responses
 * are mapped (int64 id → string) and unwrapped from the Axios envelope here.
 */
export const UsersApi = {
  getAll: async (): Promise<UserRecord[]> => {
    const res = await apiClient.get<UtilisateurResponseDTO[]>(
      API_ENDPOINTS.USERS,
    );
    return res.data.map(toUserRecord);
  },

  getById: async (id: string): Promise<UserRecord> => {
    const res = await apiClient.get<UtilisateurResponseDTO>(
      API_ENDPOINTS.USER(id),
    );
    return toUserRecord(res.data);
  },

  /** Creation goes through the admin-only register endpoint. */
  create: async (
    input: UserCreateInput,
    entrepriseId: number,
  ): Promise<UserRecord> => {
    const res = await apiClient.post<AuthTokensDTO>(
      API_ENDPOINTS.AUTH.REGISTER,
      toRegisterRequest(input, entrepriseId),
    );
    // Register returns the new user in a LoginResponse; map its `user` payload.
    return toUserRecordFromUserInfo(res.data.user);
  },

  update: async (id: string, input: UserUpdateInput): Promise<UserRecord> => {
    const res = await apiClient.put<UtilisateurResponseDTO>(
      API_ENDPOINTS.USER(id),
      toUtilisateurUpdateRequest(input),
    );
    return toUserRecord(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USER(id));
  },
};
