import { DEFAULT_COUNTRY, toE164, type CountryCode } from "@/lib/countries";
import type {
  ClientRequestDTO,
  ClientResponseDTO,
  Customer,
  CustomerWrite,
} from "../types";

/** `ClientResponseDTO` → `Customer` (int64 id → string to avoid JS precision loss). */
export function toCustomer(dto: ClientResponseDTO): Customer {
  return {
    id: String(dto.id),
    lastName: dto.nom,
    firstName: dto.prenom,
    addressLine1: dto.adresse1 ?? null,
    addressLine2: dto.adresse2 ?? null,
    city: dto.ville ?? null,
    postalCode: dto.codePostal ?? null,
    country: dto.pays ?? null,
    email: dto.mail ?? null,
    phone: dto.numTel ?? null,
    photo: dto.photo ?? null,
  };
}

/** `CustomerWrite` → `ClientRequestDTO` (empty strings dropped so the backend keeps the fields absent). */
export function toClientRequest(input: CustomerWrite): ClientRequestDTO {
  return {
    nom: input.lastName,
    prenom: input.firstName,
    adresse1: input.addressLine1 || undefined,
    adresse2: input.addressLine2 || undefined,
    ville: input.city || undefined,
    codePostal: input.postalCode || undefined,
    pays: (input.country || undefined) as CountryCode | undefined,
    mail: input.email || undefined,
    // The phone control displays a default country when none is selected,
    // so the number is composed against that same country.
    numTel: input.phone
      ? toE164(input.phone, (input.country || DEFAULT_COUNTRY) as CountryCode)
      : undefined,
    photo: input.photo || undefined,
  };
}
