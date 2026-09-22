/**
 * Companies — real shapes pinned from swagger.json.
 *
 * Backend resource: «entreprises» (French), reserved to the SUPER_ADMIN:
 * these are the platform's CLIENT companies (tenants), not something a
 * company's own ADMIN may browse. Components never see DTOs; mapping happens
 * in ../api/mappers.ts.
 */

/**
 * Request body of POST /api/entreprises — swagger `EntrepriseRequestDTO`
 * (only `nom` required). Creating a company *with* its first admin account
 * goes through the platform onboarding endpoint instead.
 */
export interface EntrepriseRequestDTO {
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
 * Request body of PUT /api/entreprises/{id} — swagger `EntrepriseUpdateDTO`.
 *
 * ⚠ Contact details ONLY. The contract states the name is the tenant
 * partitioning key and cannot be changed, which is why `nom` is absent here
 * and why the edit form renders it read-only.
 */
export interface EntrepriseUpdateDTO {
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  mail?: string;
  numTel?: string;
}

/** Raw response body of GET/POST/PUT /api/entreprises — `EntrepriseResponseDTO`. */
export interface EntrepriseResponseDTO {
  id: number;
  nom: string;
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  mail?: string;
  numTel?: string;
  /** Accounts attached to this tenant. */
  nbUtilisateurs?: number;
}

/**
 * Domain model — mapped from `EntrepriseResponseDTO` in ../api/mappers.ts.
 * Type alias (not interface) for TanStack Table v9's `RowData` constraint.
 */
export type Company = {
  /** int64 in swagger; kept as string domain-wide. */
  id: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  /** ISO alpha-2 for records created through the country picker; older rows hold free text. */
  country?: string;
  email?: string;
  phone?: string;
  userCount: number;
};

/** Client-side write input for POST /api/entreprises. */
export type CompanyWrite = {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
};

/** Client-side write input for PUT — contact details only (no name). */
export type CompanyContactWrite = Omit<CompanyWrite, "name" | "postalCode">;
