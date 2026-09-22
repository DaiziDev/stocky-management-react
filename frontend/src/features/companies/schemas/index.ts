import { z } from "zod";
import {
  DEFAULT_COUNTRY,
  isValidNationalNumber,
  type CountryCode,
} from "@/lib/countries";

/**
 * Companies form schemas — mirror the swagger write shapes.
 *
 * ⚠ REQUIRED-FIELD RULE: only what the contract marks required may be
 * required here. `EntrepriseRequestDTO` requires `nom` and nothing else;
 * `EntrepriseUpdateDTO` requires nothing at all. Optional fields are still
 * format-checked when filled — a malformed email is refused, an empty one
 * is not.
 */

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} ne peut dépasser ${max} caractères`)
    .optional()
    .or(z.literal(""));

/** Contact details — the whole body of PUT /api/entreprises/{id}. */
const contactShape = {
  addressLine1: optionalText(255, "L’adresse"),
  addressLine2: optionalText(255, "L’adresse"),
  /** ISO alpha-2; the country/city/phone controls all read and write this. */
  country: optionalText(2, "Le pays"),
  city: optionalText(100, "La ville"),
  email: z
    .string()
    .email("Adresse email invalide")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Le numéro ne peut dépasser 20 caractères")
    .optional()
    .or(z.literal("")),
};

/**
 * A phone number is only meaningful against a country, so the check lives in
 * a cross-field refinement: "677889900" is a valid Cameroonian mobile and an
 * invalid French one.
 */
function checkPhone(
  values: { country?: string; phone?: string },
  ctx: z.RefinementCtx,
): void {
  const country = (values.country || DEFAULT_COUNTRY) as CountryCode;
  if (values.phone && !isValidNationalNumber(values.phone, country)) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Numéro invalide pour le pays sélectionné",
    });
  }
}

/** Create body — `EntrepriseRequestDTO` (name required). */
export const CompaniesSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Le nom est obligatoire")
      .max(100, "Le nom ne peut dépasser 100 caractères"),
    ...contactShape,
  })
  .superRefine(checkPhone);

/** Update body — `EntrepriseUpdateDTO`: contact only, the name is immutable. */
export const CompanyContactSchema = z
  .object(contactShape)
  .superRefine(checkPhone);

export type CompaniesFormData = z.infer<typeof CompaniesSchema>;
export type CompanyContactFormData = z.infer<typeof CompanyContactSchema>;
