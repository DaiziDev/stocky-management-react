import { z } from "zod";

/**
 * Sales (POS checkout) schema — mirrors swagger `VenteRequestDTO`:
 * `clientId` optional (walk-in sales), at least one line with a positive
 * integer quantity. Line pricing is server-side; stock sufficiency is
 * enforced server-side (409 on insufficient stock for any line).
 * Messages in French to match the schema convention.
 */

export const SaleLineSchema = z.object({
  articleId: z.string().min(1, "Sélectionnez un article"),
  quantity: z
    .number({ message: "Quantité invalide" })
    .int("La quantité doit être un entier")
    .positive("La quantité doit être supérieure à 0")
    .max(100000, "La quantité est trop élevée"),
});

export const SaleSchema = z.object({
  customerId: z.string().optional(),
  lines: z
    .array(SaleLineSchema)
    .min(1, "Ajoutez au moins un article au panier"),
});

export type SaleLineFormData = z.infer<typeof SaleLineSchema>;
export type SaleFormData = z.infer<typeof SaleSchema>;
