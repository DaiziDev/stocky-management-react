import apiClient from "@/api/client";
import { clearTokens, getRefreshToken, storeTokens } from "@/api/tokens";
import { API_ENDPOINTS } from "@/lib/constants";
import { toAuthUser, toAuthUserFromMe } from "./mappers";
import type { AuthTokensDTO, AuthUser, CurrentUserResponseDTO } from "../types";

/**
 * Auth API — pinned to swagger.json:
 *   POST /api/auth/login   → AuthTokensDTO { token, refreshToken, user }
 *   POST /api/auth/refresh → AuthTokensDTO  (token rotation)
 *   POST /api/auth/logout  → 204            (revokes the refresh token)
 *   GET  /api/auth/me      → CurrentUserResponse
 *
 * Token storage lives in `@/api/tokens` — the same module the axios
 * interceptor reads, so there is exactly one source of truth. Silent renewal
 * on an expired access token is handled by the interceptor, not here; this
 * module only covers the explicit flows (login, logout).
 */
export const authApi = {
  /** Login and persist both tokens; returns the mapped domain user. */
  login: async (credentials: {
    login: string;
    motDePasse: string;
  }): Promise<AuthUser> => {
    const res = await apiClient.post<AuthTokensDTO>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    storeTokens(res.data.token, res.data.refreshToken);
    return toAuthUser(res.data.user);
  },

  /**
   * Bootstrap the session from a stored JWT on app mount (ProtectedRoute
   * awaits this before rendering protected routes).
   * 401 → null (treated as logged-out, not an error).
   */
  me: async (): Promise<AuthUser | null> => {
    try {
      const res = await apiClient.get<CurrentUserResponseDTO>(
        API_ENDPOINTS.AUTH.ME,
      );
      return toAuthUserFromMe(res.data);
    } catch (error) {
      if (isUnauthorized(error)) return null;
      throw error;
    }
  },

  /**
   * Revoke the refresh token server-side, then purge local credentials.
   * The endpoint is idempotent and its failure must never strand the user in
   * a half-logged-in state, so network errors are swallowed on purpose.
   */
  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      } catch {
        // Already revoked, expired, or offline — local purge is what matters.
      }
    }
    clearTokens();
  },
};

/**
 * True when an error means "no valid session": a 401, or the backend's
 * 403-with-empty-body signal for a missing/expired JWT (see api/client.ts
 * isSessionInvalid). Exported for useAuthBootstrap's stale-session purge.
 */
export function isUnauthorized(error: unknown): boolean {
  // The backend answers 401 with a JSON body, but signals a *missing/expired*
  // JWT with 403 and an EMPTY body (Spring Security default). Both mean "no
  // valid session"; a business 403 always carries a message body.
  const apiErr = error as { status?: number; message?: string };
  if (apiErr?.status === 401) return true;
  if (apiErr?.status === 403) {
    return (
      !apiErr.message ||
      apiErr.message.trim() === "" ||
      apiErr.message.includes("Access Denied")
    );
  }
  return false;
}
