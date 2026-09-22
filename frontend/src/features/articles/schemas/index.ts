import { z } from "zod";

/**
 * Standard VAT rate in Cameroon: 19.25 % (18 % VAT + 1.25 % additional
 * council tax), stored as the domain's decimal fraction. Used as the default
 * for a new article; the field stays editable for exempt or reduced items.
 */
export const DEFAULT_VAT_RATE = 0.1925;

/**
 * Articles form schema — mirrors swagger `ArticleRequestDTO`
 * (required: codeArticle, designation, prixUnitaireHt, tauxTva, categorieId).
 * Messages in French to match the auth/categories schema convention.
 */
export const ArticlesSchema = z.object({
  code: z
    .string()
    .min(1, "Le code est obligatoire")
    .max(50, "Le code ne peut dépasser 50 caractères"),
  designation: z
    .string()
    .min(1, "La désignation est obligatoire")
    .max(255, "La désignation ne peut dépasser 255 caractères"),
  unitPriceHt: z
    .number("Le prix unitaire HT est obligatoire")
    .positive("Le prix unitaire HT doit être positif"),
  // Decimal fraction (0.2 = 20%); the mapper converts to the wire percentage (×100).
  vatRate: z
    .number("Le taux de TVA est obligatoire")
    .min(0, "Le taux de TVA doit être positif")
    .max(1, "Le taux de TVA doit être inférieur à 1"),
  // Optional per the contract — the message must not claim otherwise; it is
  // only ever shown when a value IS present but malformed.
  // Empty values from existing records are treated as absent; photo has no
  // input in the form and must not block an otherwise valid edit.
  photo: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().url("URL invalide").optional(),
  ),
  minStock: z
    .number({ message: "Seuil invalide" })
    .int("Le seuil doit être un entier")
    .min(0, "Le seuil doit être positif")
    .optional(),
  categoryId: z.string().regex(/^\d+$/, "La catégorie est obligatoire"),
});

export type ArticlesFormData = z.infer<typeof ArticlesSchema>;
