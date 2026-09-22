import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "./interceptors";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  storeTokens,
} from "./tokens";

/**
 * Session-invalid detection.
 *
 * This backend signals a missing/expired/invalid JWT with **403 and an empty
 * body** (Spring Security's default `AccessDeniedHandler` output), not 401:
 * verified by probing the live server with no token and with a bogus token.
 * A *business* 403 (authenticated but not allowed) also arrives with an empty
 * body on some endpoints, which is why an ambiguous 403 is confirmed with a
 * bare `/auth/me` probe before the session is touched.
 *
 * ⚠ Deployed dev note: the backend also omits CORS headers on these 403s, so
 * when the frontend talks to the API cross-origin (no Vite proxy), the browser
 * hides the response entirely and this never runs — one more reason the dev
 * proxy (VITE_API_URL=/api) is the recommended wiring.
 */
function isSessionInvalid(error: AxiosError): boolean {
  const status = error.response?.status;
  if (status === 401) return true;
  if (status === 403) {
    const data = error.response?.data as unknown;
    if (data === null || data === undefined || data === "") return true;
    if (typeof data === "string" && data.trim() === "") return true;
  }
  return false;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

/** Internal request flags — never sent to the backend. */
type TaggedConfig = AxiosRequestConfig & {
  /** The bare /auth/me call used to tell a dead token from a business 403. */
  __sessionProbe?: boolean;
  /** Set once a request has already been replayed after a token refresh. */
  __retried?: boolean;
};

class ApiClient {
  private client: AxiosInstance;

  /**
   * In-flight refresh, shared by every request that hits an expired token at
   * the same time. The backend ROTATES refresh tokens, so two parallel
   * refreshes would make the second one fail and kill a healthy session —
   * they must all await the same call.
   */
  private refreshInFlight: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      // NOTE: no `withCredentials`. Auth is a Bearer JWT in the Authorization
      // header (see the request interceptor) — cookies are never used. Sending
      // credentials puts the request in CORS "credentialed" mode, which the
      // browser only honors when the backend replies
      // `Access-Control-Allow-Credentials: true` (it does not) — every call
      // then fails as a CORS error even though the server answered.
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const config = error.config as TaggedConfig | undefined;

        // Results of the session probe land here — normalize and reject.
        if (config?.__sessionProbe) {
          return Promise.reject(this.normalizeError(error));
        }

        // Auth endpoints own their failures: a bad password or a dead refresh
        // token must surface to the caller, not trigger recovery machinery.
        const url = config?.url ?? "";
        const isAuthEndpoint =
          url.includes(API_ENDPOINTS.AUTH.ME) ||
          url.includes(API_ENDPOINTS.AUTH.LOGIN) ||
          url.includes(API_ENDPOINTS.AUTH.REFRESH) ||
          url.includes(API_ENDPOINTS.AUTH.LOGOUT);

        if (isSessionInvalid(error) && !isAuthEndpoint && !config?.__retried) {
          return this.recoverSession(error);
        }

        return Promise.reject(this.normalizeError(error));
      },
    );
  }

  /**
   * Handle an ambiguous (empty-body) 403 / 401 in three steps:
   *
   *   1. Probe `/auth/me`. If it succeeds the access token is still valid, so
   *      the original error was a *business* 403 — surface it untouched and
   *      never log the user out.
   *   2. The token is dead → exchange the refresh token for a new pair and
   *      replay the original request once.
   *   3. No refresh token, or the refresh was rejected → the session is
   *      genuinely over: purge credentials and send the user to /login.
   */
  private async recoverSession(error: AxiosError): Promise<AxiosResponse> {
    // 1. Is the access token actually dead, or was this a business denial?
    if (!(await this.isTokenDead())) {
      throw this.normalizeError(error);
    }

    // 2. Dead token → rotate it and replay the original call once. The caller
    //    receives the replayed response and never learns about the renewal.
    const config = error.config as TaggedConfig | undefined;
    if (config && getRefreshToken()) {
      try {
        const token = await this.refreshSession();
        config.__retried = true;
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        } as AxiosRequestConfig["headers"];
        return await this.client.request(config);
      } catch {
        // Refresh rejected or the replay failed → the session is over.
      }
    }

    // 3. Nothing left to try.
    this.handleAuthFailure();
    throw this.normalizeError(error);
  }

  /**
   * True when a bare `/auth/me` is rejected for auth reasons, i.e. the access
   * token can no longer be used. A *network* failure answers false: losing
   * connectivity must never be mistaken for an expired session.
   */
  private async isTokenDead(): Promise<boolean> {
    try {
      await this.client.get(API_ENDPOINTS.AUTH.ME, {
        __sessionProbe: true,
      } as TaggedConfig);
      return false;
    } catch (probeError) {
      const status = (probeError as ApiError)?.status;
      return status === 401 || status === 403;
    }
  }

  /**
   * POST /auth/refresh, de-duplicated across concurrent callers.
   * Resolves with the new access token; rejects when the session is over.
   */
  private refreshSession(): Promise<string> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.reject(new Error("No refresh token"));

    this.refreshInFlight = this.client
      .post<{ token: string; refreshToken: string }>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken },
      )
      .then((response) => {
        const { token, refreshToken: rotated } = response.data;
        if (!token) throw new Error("Refresh returned no token");
        storeTokens(token, rotated);
        return token;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  private handleAuthFailure(): void {
    clearTokens();

    // Keep the URL language segment across the hard redirect.
    const seg = window.location.pathname.split("/")[1];
    const langPrefix = ["fr", "en"].includes(seg) ? `/${seg}` : "";
    const loginPath = `${langPrefix}/login`;
    if (window.location.pathname !== loginPath) {
      window.location.href = loginPath;
    }
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response) {
      // The backend's own message wins. When the body is empty (this backend
      // sends empty-bodied 401/403 from the security layer), substitute proper
      // French copy instead of axios's "Request failed with status code N".
      const backendMessage = (
        error.response.data as { message?: string } | null
      )?.message;
      const status = error.response.status;
      const fallbackByStatus: Partial<Record<number, string>> = {
        401: "Session expirée ou identifiants invalides.",
        403: "Accès refusé par le serveur.",
      };
      return {
        status,
        message: backendMessage || fallbackByStatus[status] || error.message,
        errors: (
          error.response.data as { errors?: Record<string, string[]> } | null
        )?.errors,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 0,
      message: error.message || "Network error",
      timestamp: new Date().toISOString(),
    };
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient.getClient();
