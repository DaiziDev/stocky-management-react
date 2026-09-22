import { z } from "zod";
import {
  DEFAULT_COUNTRY,
  isValidNationalNumber,
  type CountryCode,
} from "@/lib/countries";

/**
 * Onboarding form schema — mirrors swagger `AdminEntrepriseRequestDTO`.
 *
 * ⚠ REQUIRED-FIELD RULE: the contract's `required` array lists exactly five
 * fields — nomEntreprise, adminPrenom, adminNom, adminLogin, adminMotDePasse.
 * Nothing else may be mandatory here. Making the form stricter than the API
 * would reject companies the backend accepts, so every other field is
 * `.optional()` and is only checked for FORMAT when the user actually fills
 * it in (a malformed email is refused, an empty one is not).
 *
 * Messages are in French to match the project's schema convention.
 */

/** Optional free text with a length ceiling; "" is accepted as "not filled". */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} ne peut dépasser ${max} caractères`)
    .optional()
    .or(z.literal(""));

/** Optional email — validated only when something was typed. */
const optionalEmail = z
  .string()
  .email("Adresse email invalide")
  .optional()
  .or(z.literal(""));

/** Optional national phone digits — the country decides what is valid. */
const optionalPhone = z
  .string()
  .max(20, "Le numéro ne peut dépasser 20 caractères")
  .optional()
  .or(z.literal(""));

const onboardingShape = z.object({
  /* ---- Company — only the name is required by the contract ---- */
  companyName: z
    .string()
    .trim()
    .min(1, "Le nom de l’entreprise est obligatoire")
    .max(100, "Le nom ne peut dépasser 100 caractères"),
  addressLine1: optionalText(255, "L’adresse"),
  addressLine2: optionalText(255, "L’adresse"),
  /** ISO alpha-2; the country/phone/city controls all read and write this. */
  country: optionalText(2, "Le pays"),
  city: optionalText(100, "La ville"),
  companyEmail: optionalEmail,
  companyPhone: optionalPhone,

  /* ---- First ADMIN account — four required fields ---- */
  adminFirstName: z
    .string()
    .trim()
    .min(1, "Le prénom de l’administrateur est obligatoire")
    .max(50, "Le prénom ne peut dépasser 50 caractères"),
  adminLastName: z
    .string()
    .trim()
    .min(1, "Le nom de l’administrateur est obligatoire")
    .max(50, "Le nom ne peut dépasser 50 caractères"),
  adminLogin: z
    .string()
    .trim()
    .min(1, "L’identifiant de connexion est obligatoire")
    .max(100, "L’identifiant ne peut dépasser 100 caractères"),
  adminPassword: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(100, "Le mot de passe ne peut dépasser 100 caractères"),
  adminPhone: optionalPhone,
});

/**
 * Phone numbers are checked against the selected country, which is why this
 * lives in a cross-field refinement rather than on the field itself: "677889900"
 * is a valid Cameroonian mobile and an invalid French one, and only the form
 * knows which country was picked.
 */
export const CompanyOnboardingSchema = onboardingShape.superRefine(
  (values, ctx) => {
    const country = (values.country || DEFAULT_COUNTRY) as CountryCode;

    for (const field of ["companyPhone", "adminPhone"] as const) {
      const value = values[field];
      if (value && !isValidNationalNumber(value, country)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Numéro invalide pour le pays sélectionné",
        });
      }
    }
  },
);

export type CompanyOnboardingFormData = z.infer<typeof CompanyOnboardingSchema>;

/**
 * Blank form state. `country` is pre-filled with the platform's home country
 * so the phone control's flag and dial code match what the form actually
 * holds — showing 🇨🇲 +237 while storing "no country" would be a lie.
 */
export const EMPTY_ONBOARDING: CompanyOnboardingFormData = {
  companyName: "",
  addressLine1: "",
  addressLine2: "",
  country: DEFAULT_COUNTRY,
  city: "",
  companyEmail: "",
  companyPhone: "",
  adminFirstName: "",
  adminLastName: "",
  adminLogin: "",
  adminPassword: "",
  adminPhone: "",
};
