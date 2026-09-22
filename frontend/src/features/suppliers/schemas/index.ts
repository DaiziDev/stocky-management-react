import { z } from "zod";
import {
  DEFAULT_COUNTRY,
  isValidNationalNumber,
  type CountryCode,
} from "@/lib/countries";

/**
 * A phone number is only meaningful against a country, so the check lives in
 * a cross-field refinement: "677889900" is a valid Cameroonian mobile and an
 * invalid US one. The country control displays a default when none is
 * selected, and validation follows that same rule.
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

/**
 * Suppliers form schema — mirrors swagger `FournisseurRequestDTO`
 * (only `nom` required; contact fields validated loosely when present).
 * Messages in French to match the schema convention.
 */
export const SuppliersSchema = z
  .object({
    name: z
      .string()
      .min(1, "Le nom est obligatoire")
      .max(100, "Le nom ne peut dépasser 100 caractères"),
    addressLine1: z
      .string()
      .max(255, "L’adresse ne peut dépasser 255 caractères")
      .optional(),
    addressLine2: z
      .string()
      .max(255, "L’adresse ne peut dépasser 255 caractères")
      .optional(),
    city: z
      .string()
      .max(100, "La ville ne peut dépasser 100 caractères")
      .optional(),
    postalCode: z
      .string()
      .max(20, "Le code postal ne peut dépasser 20 caractères")
      .optional(),
    /** ISO alpha-2; the country/city/phone controls all read and write this. */
    country: z
      .string()
      .max(2, "Le pays ne peut dépasser 2 caractères")
      .optional()
      .or(z.literal("")),
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
  })
  .superRefine(checkPhone);

export type SuppliersFormData = z.infer<typeof SuppliersSchema>;
