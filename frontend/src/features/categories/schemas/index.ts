import { z } from "zod";

/**
 * Categories form schema — mirrors swagger `CategorieRequestDTO`
 * (code + designation, both required, both strings).
 * Messages in French to match the auth schema convention.
 */
export const CategoriesSchema = z.object({
  code: z
    .string()
    .min(1, "Le code est obligatoire")
    .max(50, "Le code ne peut dépasser 50 caractères"),
  designation: z
    .string()
    .min(1, "La désignation est obligatoire")
    .max(255, "La désignation ne peut dépasser 255 caractères"),
});

export type CategoriesFormData = z.infer<typeof CategoriesSchema>;
