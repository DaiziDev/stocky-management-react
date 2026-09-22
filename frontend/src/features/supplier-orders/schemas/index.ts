import { z } from "zod";

/**
 * Supplier-order form schema — mirrors swagger `CommandeFournisseurRequestDTO`:
 * a supplier + at least one line { articleId, quantite > 0 }. Line pricing is
 * server-side, so there is nothing price-related to validate here.
 * Messages in French to match the schema convention.
 */

/** One order line — article picked from the catalog, positive quantity. */
export const SupplierOrderLineSchema = z.object({
  articleId: z.string().min(1, "Sélectionnez un article"),
  quantity: z
    .number({ message: "Quantité invalide" })
    .int("La quantité doit être un entier")
    .positive("La quantité doit être supérieure à 0")
    .max(100000, "La quantité est trop élevée"),
});

export const SupplierOrderSchema = z.object({
  supplierId: z.string().min(1, "Sélectionnez un fournisseur"),
  lines: z
    .array(SupplierOrderLineSchema)
    .min(1, "Ajoutez au moins un article à la commande"),
});

export type SupplierOrderLineFormData = z.infer<typeof SupplierOrderLineSchema>;
export type SupplierOrderFormData = z.infer<typeof SupplierOrderSchema>;

/**
 * Partial reception — mirrors swagger `ReceptionPartielleDTO` /`LigneRecueDTO`.
 *
 * The contract requires only `lignes` (and `ligneId` inside each entry);
 * `quantiteRecue` is optional with a minimum of 0, so a line left at 0 is
 * valid and simply means "nothing received yet" — the mapper drops those.
 * The per-line ceiling (never receive more than ordered) is enforced by the
 * dialog, which knows the outstanding quantity for each line.
 */
export const ReceivedLineSchema = z.object({
  lineId: z.string().min(1),
  receivedQuantity: z
    .number({ message: "Quantité invalide" })
    .int("La quantité doit être un entier")
    .min(0, "La quantité ne peut pas être négative"),
});

export const PartialReceptionSchema = z
  .object({ lines: z.array(ReceivedLineSchema) })
  .refine((v) => v.lines.some((l) => l.receivedQuantity > 0), {
    message: "Saisissez au moins une quantité reçue",
    path: ["lines"],
  });

export type PartialReceptionFormData = z.infer<typeof PartialReceptionSchema>;
