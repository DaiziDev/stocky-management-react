/**
 * Users — real shapes pinned from swagger.json (roadmap P0.2 / P3.3).
 *
 * Backend contract:
 *   GET    /api/utilisateurs       → UtilisateurResponseDTO[] (scoped to «mon entreprise», bare array)
 *   PUT    /api/utilisateurs/{id}  → UtilisateurResponseDTO   (UtilisateurUpdateDTO body)
 *   DELETE /api/utilisateurs/{id}
 *   POST   /api/auth/register      → LoginResponse            (ADMIN-only creation — RegisterRequest)
 *
 * NOTE: UtilisateurUpdateDTO cannot change the login or the password, and
 * there is no `active` flag — deletion is a hard delete (the roadmap's
 * "deactivation" does not exist server-side). The page guards self-deletion.
 */

import type { UserRole } from "@/features/auth/types";

/** Response of GET/PUT /api/utilisateurs — swagger `UtilisateurResponseDTO`. */
export interface UtilisateurResponseDTO {
  id: number;
  nom: string;
  prenom: string;
  login: string;
  mail?: string;
  numTel?: string;
  role: UserRole;
}

/** Body of PUT /api/utilisateurs/{id} — swagger `UtilisateurUpdateDTO` (login/password immutable). */
export interface UtilisateurUpdateDTO {
  nom: string;
  prenom: string;
  mail?: string;
  numTel?: string;
  role: UserRole;
}

/** Body of POST /api/auth/register — swagger `RegisterRequest`. `entrepriseId` = the admin's company. */
export interface RegisterRequestDTO {
  entrepriseId: number;
  login: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  role: UserRole;
  mail?: string;
  numTel?: string;
}

/**
 * Domain user row — mapped from `UtilisateurResponseDTO` in ../api/mappers.ts.
 * Type alias (not interface) for TanStack Table v9's `RowData` constraint.
 */
export type UserRecord = {
  id: string;
  login: string;
  /** `prenom`. */
  firstName: string;
  /** `nom`. */
  lastName: string;
  /** `mail` when present. */
  email: string | null;
  /** `numTel` when present. */
  phone: string | null;
  role: UserRole;
};

/** Create payload (POST /auth/register) — `entrepriseId` is injected from the auth store by the API layer. */
export type UserCreateInput = {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: UserRole;
};

/** Edit payload (PUT /utilisateurs/{id}). */
export type UserUpdateInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: UserRole;
};
