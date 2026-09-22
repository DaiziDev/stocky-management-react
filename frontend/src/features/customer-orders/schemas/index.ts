import { z } from "zod";

/**
 * Customer-order form schema — mirrors swagger `CommandeClientRequestDTO`:
 * a client + at least one line { articleId, quantite > 0 }. Line pricing is
 * server-side, so there is nothing price-related to validate here.
 * Messages in French to match the schema convention.
 */

/** One order line — article picked from the catalog, positive quantity. */
export const OrderLineSchema = z.object({
  articleId: z.string().min(1, "Sélectionnez un article"),
  quantity: z
    .number({ message: "Quantité invalide" })
    .int("La quantité doit être un entier")
    .positive("La quantité doit être supérieure à 0")
    .max(100000, "La quantité est trop élevée"),
});

export const CustomerOrderSchema = z.object({
  customerId: z.string().min(1, "Sélectionnez un client"),
  lines: z
    .array(OrderLineSchema)
    .min(1, "Ajoutez au moins un article à la commande"),
});

export type CustomerOrderLineFormData = z.infer<typeof OrderLineSchema>;
export type CustomerOrderFormData = z.infer<typeof CustomerOrderSchema>;
