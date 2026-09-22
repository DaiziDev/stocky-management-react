import { DEFAULT_COUNTRY, toE164, type CountryCode } from "@/lib/countries";
import type {
  Company,
  CompanyContactWrite,
  CompanyWrite,
  EntrepriseRequestDTO,
  EntrepriseResponseDTO,
  EntrepriseUpdateDTO,
} from "../types";

/**
 * DTO → domain mappers for the companies feature.
 * int64 id → string; optional address fields pass through as undefined.
 */

export function toCompany(dto: EntrepriseResponseDTO): Company {
  return {
    id: String(dto.id),
    name: dto.nom,
    addressLine1: dto.adresse1,
    addressLine2: dto.adresse2,
    city: dto.ville,
    postalCode: dto.codePostal,
    country: dto.pays,
    email: dto.mail,
    phone: dto.numTel,
    userCount: dto.nbUtilisateurs ?? 0,
  };
}

/** Blank strings are how empty inputs arrive; the wire wants them absent. */
const trimmed = (value: string | undefined): string | undefined => {
  const next = value?.trim();
  return next ? next : undefined;
};

/** Contact fields shared by the create and update bodies. */
function toContactFields(input: CompanyContactWrite): EntrepriseUpdateDTO {
  const country = trimmed(input.country) as CountryCode | undefined;
  // The phone control displays a default country when none is selected, so
  // the number is composed against that; `pays` stays absent unless chosen.
  const national = trimmed(input.phone);

  return {
    adresse1: trimmed(input.addressLine1),
    adresse2: trimmed(input.addressLine2),
    ville: trimmed(input.city),
    pays: country,
    mail: trimmed(input.email),
    numTel: national ? toE164(national, country ?? DEFAULT_COUNTRY) : undefined,
  };
}

/** `CompanyWrite` → `EntrepriseRequestDTO` (only `nom` is required by the API). */
export function toEntrepriseRequest(input: CompanyWrite): EntrepriseRequestDTO {
  return {
    nom: input.name.trim(),
    ...toContactFields(input),
  };
}

/**
 * `CompanyContactWrite` → `EntrepriseUpdateDTO`.
 * The name is deliberately absent: the backend treats it as the tenant
 * partitioning key and refuses to change it.
 */
export function toEntrepriseUpdateRequest(
  input: CompanyContactWrite,
): EntrepriseUpdateDTO {
  return toContactFields(input);
}
