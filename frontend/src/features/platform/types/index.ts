/**
 * Platform console — shapes pinned from swagger.json (tag «🛰️ Plateforme»).
 *
 * This feature is SUPER_ADMIN-only. It covers the two platform endpoints:
 *   GET  /api/plateforme/stats       → PlateformeStatsDTO
 *   POST /api/plateforme/entreprises → AdminEntrepriseRequestDTO
 *                                      → EntrepriseResponseDTO
 *
 * Listing / updating / deleting client companies reuses the «entreprises»
 * resource (features/companies), which swagger marks as SUPER_ADMIN-reserved.
 */

/* ------------------------------------------------------------------ */
/* Onboarding (company + its first ADMIN, one transaction)             */
/* ------------------------------------------------------------------ */

/**
 * Body of POST /api/plateforme/entreprises — swagger `AdminEntrepriseRequestDTO`.
 *
 * ⚠ REQUIRED, per the contract's `required` array, is exactly:
 *   nomEntreprise, adminPrenom, adminNom, adminLogin, adminMotDePasse.
 * Everything else is optional and must stay optional in the form schema.
 */
export interface AdminEntrepriseRequestDTO {
  nomEntreprise: string;
  adresse1?: string;
  adresse2?: string;
  ville?: string;
  pays?: string;
  mailEntreprise?: string;
  numTelEntreprise?: string;
  adminPrenom: string;
  adminNom: string;
  adminLogin: string;
  adminMotDePasse: string;
  adminNumTel?: string;
}

/**
 * Client-side onboarding input — English domain names.
 *
 * `country` is an ISO 3166-1 alpha-2 code, and the two phone numbers are the
 * NATIONAL part only: the mapper composes E.164 from the shared country, so
 * the form never has to carry a dial code of its own.
 */
export interface CompanyOnboarding {
  companyName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  /** ISO alpha-2 ("CM") — stable across UI languages, unlike a country name. */
  country?: string;
  companyEmail?: string;
  /** National digits; combined with `country` into E.164 by the mapper. */
  companyPhone?: string;
  adminFirstName: string;
  adminLastName: string;
  adminLogin: string;
  adminPassword: string;
  /** National digits; combined with `country` into E.164 by the mapper. */
  adminPhone?: string;
}

/* ------------------------------------------------------------------ */
/* Platform statistics                                                 */
/* ------------------------------------------------------------------ */

/** Nested item of PlateformeStatsDTO — swagger `EntrepriseRecenteDTO`. */
export interface EntrepriseRecenteDTO {
  id: number;
  nom: string;
  mail?: string;
  ville?: string;
  nbUtilisateurs?: number;
  /** ISO date-time. */
  createdAt?: string;
}

/** Raw response of GET /api/plateforme/stats — swagger `PlateformeStatsDTO`. */
export interface PlateformeStatsDTO {
  nbEntreprises?: number;
  nbUtilisateurs?: number;
  nbAdmins?: number;
  nbClients?: number;
  nbArticles?: number;
  nbVentes?: number;
  nbVentesDuMois?: number;
  chiffreAffairesDuMois?: number;
  nbArticlesEnAlerte?: number;
  nbCommandesEnCours?: number;
  nbNouvellesEntreprisesDuMois?: number;
  dernieresEntreprises?: EntrepriseRecenteDTO[];
}

/** Domain model for a recently onboarded company (type alias for RowData). */
export type RecentCompany = {
  /** int64 in swagger; kept as string domain-wide. */
  id: string;
  name: string;
  email?: string;
  city?: string;
  userCount: number;
  /** ISO date-time, or undefined when the backend omits it. */
  createdAt?: string;
};

/**
 * Domain model for the platform overview. Every count is defaulted to 0 so
 * the dashboard never has to null-check a missing backend field.
 */
export type PlatformStats = {
  companyCount: number;
  userCount: number;
  adminCount: number;
  customerCount: number;
  articleCount: number;
  saleCount: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  articlesInAlert: number;
  ordersInProgress: number;
  newCompaniesThisMonth: number;
  recentCompanies: RecentCompany[];
};
