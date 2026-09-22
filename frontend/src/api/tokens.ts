import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Token storage — the single place that reads and writes credentials.
 *
 * Both tokens live in localStorage: the access token is read by the axios
 * request interceptor on every call, and the refresh token is used by the
 * interceptor's silent-renewal path. Keeping them here (rather than in the
 * zustand store) avoids the dual-write drift the store's comment warns about,
 * and lets `api/client.ts` and `features/auth/api` share them without a
 * circular import.
 */

export const getAccessToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

/** Persist a freshly issued pair (login, or a rotation from /auth/refresh). */
export function storeTokens(token: string, refreshToken?: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

/** Wipe every credential and cached identity. Safe to call repeatedly. */
export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
}
