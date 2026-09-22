import { z } from "zod";

/**
 * Stock adjustment schema — mirrors swagger `MvtStkRequestDTO`
 * (required: articleId, quantite, motif — all three, nothing else exists).
 *
 * The only rule beyond the contract is that the quantity may not be 0: the
 * backend would accept it, but a zero-quantity movement writes a ledger entry
 * that changes nothing, so it is refused at the form rather than silently
 * creating noise in the movements history.
 *
 * Messages in French to match the schema convention.
 */
export const StockAdjustmentSchema = z.object({
  articleId: z.string().min(1, "Sélectionnez un article"),
  quantity: z
    .number({ message: "Quantité invalide" })
    .int("La quantité doit être un entier")
    .refine((value) => value !== 0, "La quantité ne peut pas être nulle"),
  reason: z
    .string()
    .trim()
    .min(1, "Le motif est obligatoire")
    .max(255, "Le motif ne peut dépasser 255 caractères"),
});

export type StockAdjustmentFormData = z.infer<typeof StockAdjustmentSchema>;
