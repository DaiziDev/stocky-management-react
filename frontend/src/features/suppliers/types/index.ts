/**
 * Suppliers — real shapes pinned from swagger.json (roadmap P0.2 / P3.4).
 *
 * Backend resource: «fournisseurs» (French). Components never see DTOs;
 * mapping happens in ../api/mappers.ts.
 *
 * Note: the shape mirrors `EntrepriseRequestDTO` (nom + optional address/
 * contact) — no contact-person, SIRET, or active flag exists in swagger v1.0.
 */

/** Body of POST/PUT /api/fournisseurs — swagger `FournisseurRequestDTO` (only `nom` required). */
export interface FournisseurRequestDTO {
  nom: string;
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  mail?: string;
  numTel?: string;
}

/** Raw response body of GET/POST/PUT /api/fournisseurs — swagger `FournisseurResponseDTO`. */
export interface FournisseurResponseDTO {
  id: number;
  nom: string;
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  mail?: string;
  numTel?: string;
}

/**
 * Domain supplier — mapped from `FournisseurResponseDTO` in ../api/mappers.ts.
 * Type alias (not interface) for TanStack Table v9's `RowData` constraint.
 */
export type Supplier = {
  id: string;
  /** `nom`. */
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
};

/** Create/update payload (both verbs share the same DTO). */
export type SupplierWrite = {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
};
