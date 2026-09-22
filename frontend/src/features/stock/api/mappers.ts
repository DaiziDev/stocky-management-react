import type {
  ArticleStockDTO,
  MvtStkRequestDTO,
  MvtStkResponseDTO,
  StockAdjustmentInput,
  StockMovement,
  StockRow,
} from "../types";

/** `ArticleStockDTO` → `StockRow` (int64 id → string). */
export function toStockRow(dto: ArticleStockDTO): StockRow {
  return {
    articleId: String(dto.articleId),
    code: dto.codeArticle,
    designation: dto.designation,
    currentStock: dto.stockActuel,
    minThreshold: dto.seuilMin,
  };
}

/** `ValorisationResponseDTO` → total value number. */
export function toValorisation(dto: { valeurTotale: number }): number {
  return dto.valeurTotale;
}

/** `MvtStkResponseDTO` → `StockMovement` (int64 ids → string). */
export function toStockMovement(dto: MvtStkResponseDTO): StockMovement {
  return {
    id: String(dto.id),
    type: dto.type,
    quantity: dto.quantite,
    date: dto.dateMouvement,
    reason: dto.motif,
    origin: dto.origine ?? null,
    articleId: String(dto.articleId),
    articleDesignation: dto.articleDesignation,
    stockAfter: dto.stockActuelApres,
  };
}

/** `StockAdjustmentInput` → `MvtStkRequestDTO` (signed quantity, required motif). */
export function toMvtStkRequest(input: StockAdjustmentInput): MvtStkRequestDTO {
  const articleId = Number(input.articleId);
  if (!Number.isSafeInteger(articleId) || articleId <= 0) {
    throw new Error(`articleId invalide : ${input.articleId}`);
  }
  if (!Number.isInteger(input.quantity) || input.quantity === 0) {
    throw new Error("La quantité d’ajustement doit être un entier non nul.");
  }
  return {
    articleId,
    quantite: input.quantity,
    motif: input.reason,
  };
}
