/**
 * Customers — real shapes pinned from swagger.json (roadmap P0.2 / P4.1).
 *
 * Backend resource: «clients» (French). Components never see DTOs;
 * mapping happens in ../api/mappers.ts.
 *
 * Note: a customer is a *person* (nom + prenom required) — not a company —
 * with an optional address/contact block and a photo URL. No `active` flag,
 * no order-history fields on the DTO (details-page history comes later from
 * the orders feature, P4.2).
 */

/** Body of POST/PUT /api/clients — swagger `ClientRequestDTO` (nom + prenom required). */
export interface ClientRequestDTO {
  nom: string;
  prenom: string;
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  mail?: string;
  numTel?: string;
  photo?: string;
}

/** Raw response body of GET/POST/PUT /api/clients — swagger `ClientResponseDTO`. */
export interface ClientResponseDTO {
  id: number;
  nom: string;
  prenom: string;
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  mail?: string;
  numTel?: string;
  photo?: string;
}

/**
 * Domain customer — mapped from `ClientResponseDTO` in ../api/mappers.ts.
 * Type alias (not interface) for TanStack Table v9's `RowData` constraint.
 */
export type Customer = {
  id: string;
  /** `nom`. */
  lastName: string;
  /** `prenom`. */
  firstName: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  photo: string | null;
};

/** Create/update payload (both verbs share the same DTO). */
export type CustomerWrite = {
  lastName: string;
  firstName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  photo?: string;
};
