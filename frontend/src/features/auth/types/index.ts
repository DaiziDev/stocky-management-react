/**
 * Auth — real shapes pinned from swagger.json.
 *
 * Backend contract:
 *   POST /api/auth/login   → AuthTokensDTO { token, refreshToken, user }
 *   POST /api/auth/refresh → AuthTokensDTO  (rotation: the old refresh token
 *                            becomes unusable)                    (200 | 401)
 *   POST /api/auth/logout  → 204            (revokes the refresh token)
 *   GET  /api/auth/me      → CurrentUserResponse (UserInfo + mail, numTel)
 *
 * /auth/register is admin-only user creation (not self-signup) and belongs to
 * the Users feature. Platform onboarding creates a company's first ADMIN in
 * one transaction — see features/platform.
 */

/**
 * Backend roles. `SUPER_ADMIN` operates the platform itself and is NOT bound
 * to a company (`entrepriseId` is absent); every other role belongs to
 * exactly one client company.
 */
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "GESTIONNAIRE" | "VENDEUR";

/** `user` payload of AuthTokensDTO — swagger `UserInfo`. */
export interface UserInfoDTO {
  id: number;
  nom: string;
  prenom: string;
  login: string;
  role: UserRole;
  entrepriseId?: number;
  entrepriseNom?: string;
}

/**
 * Response of POST /api/auth/login and POST /api/auth/refresh —
 * swagger `AuthTokensDTO`.
 */
export interface AuthTokensDTO {
  token: string;
  refreshToken: string;
  user: UserInfoDTO;
}

/** Body of POST /api/auth/refresh and /api/auth/logout — `AuthTokensRequest`. */
export interface AuthTokensRequestDTO {
  refreshToken: string;
}

/** Response of GET /api/auth/me — swagger `CurrentUserResponse`. */
export interface CurrentUserResponseDTO extends UserInfoDTO {
  mail?: string;
  numTel?: string;
}

/** Domain user stored in auth.store — mapped from the DTOs in ../api. */
export interface AuthUser {
  id: string;
  login: string;
  /** `prenom`. */
  firstName: string;
  /** `nom`. */
  lastName: string;
  /** `mail` when known (via /auth/me); falls back to the login string. */
  email?: string;
  /** `numTel` when known (via /auth/me). */
  phone?: string;
  /** Backend sends a single role; kept as an array for role-gating helpers. */
  roles: UserRole[];
  /** Absent for SUPER_ADMIN — the platform operator owns no single company. */
  companyId?: string;
  /** `entrepriseNom`, shown in the shell so users know which tenant they are in. */
  companyName?: string;
}
