import { DEFAULT_COUNTRY, toE164, type CountryCode } from "@/lib/countries";
import type {
  AdminEntrepriseRequestDTO,
  CompanyOnboarding,
  EntrepriseRecenteDTO,
  PlateformeStatsDTO,
  PlatformStats,
  RecentCompany,
} from "../types";

/**
 * DTO ↔ domain mappers for the platform console.
 * The only place raw «Plateforme» DTOs are visible.
 */

/** `EntrepriseRecenteDTO` → `RecentCompany` (int64 id → string). */
export function toRecentCompany(dto: EntrepriseRecenteDTO): RecentCompany {
  return {
    id: String(dto.id),
    name: dto.nom,
    email: dto.mail,
    city: dto.ville,
    userCount: dto.nbUtilisateurs ?? 0,
    createdAt: dto.createdAt,
  };
}

/**
 * `PlateformeStatsDTO` → `PlatformStats`.
 * Every counter defaults to 0: the backend omits fields it has nothing to
 * report for, and a KPI tile showing "0" is correct where "—" would not be.
 */
export function toPlatformStats(dto: PlateformeStatsDTO): PlatformStats {
  return {
    companyCount: dto.nbEntreprises ?? 0,
    userCount: dto.nbUtilisateurs ?? 0,
    adminCount: dto.nbAdmins ?? 0,
    customerCount: dto.nbClients ?? 0,
    articleCount: dto.nbArticles ?? 0,
    saleCount: dto.nbVentes ?? 0,
    salesThisMonth: dto.nbVentesDuMois ?? 0,
    revenueThisMonth: dto.chiffreAffairesDuMois ?? 0,
    articlesInAlert: dto.nbArticlesEnAlerte ?? 0,
    ordersInProgress: dto.nbCommandesEnCours ?? 0,
    newCompaniesThisMonth: dto.nbNouvellesEntreprisesDuMois ?? 0,
    recentCompanies: (dto.dernieresEntreprises ?? []).map(toRecentCompany),
  };
}

/** Blank strings are how empty inputs arrive; the wire wants them absent. */
const trimmed = (value: string | undefined): string | undefined => {
  const next = value?.trim();
  return next ? next : undefined;
};

/**
 * `CompanyOnboarding` → `AdminEntrepriseRequestDTO`.
 *
 * Phone numbers are stored nationally in the form and composed into E.164
 * here, using the single country the form holds — so the company and its
 * admin can never end up with numbers from two different countries.
 * Optional fields left blank are omitted entirely rather than sent as "".
 */
export function toAdminEntrepriseRequest(
  input: CompanyOnboarding,
): AdminEntrepriseRequestDTO {
  const country = trimmed(input.country) as CountryCode | undefined;
  // The phone control shows a default country even when none is selected, so
  // compose the number against what the user actually saw. `pays` itself is
  // only sent when a country was really chosen.
  const phoneCountry = country ?? DEFAULT_COUNTRY;
  const phone = (national: string | undefined): string | undefined => {
    const value = trimmed(national);
    return value ? toE164(value, phoneCountry) : undefined;
  };

  return {
    nomEntreprise: input.companyName.trim(),
    adresse1: trimmed(input.addressLine1),
    adresse2: trimmed(input.addressLine2),
    ville: trimmed(input.city),
    pays: country,
    mailEntreprise: trimmed(input.companyEmail),
    numTelEntreprise: phone(input.companyPhone),
    adminPrenom: input.adminFirstName.trim(),
    adminNom: input.adminLastName.trim(),
    adminLogin: input.adminLogin.trim(),
    // Never trimmed: leading/trailing spaces can be part of a password.
    adminMotDePasse: input.adminPassword,
    adminNumTel: phone(input.adminPhone),
  };
}
