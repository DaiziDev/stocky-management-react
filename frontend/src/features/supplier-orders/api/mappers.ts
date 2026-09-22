import type {
  CommandeFournisseurRequestDTO,
  LigneRecueDTO,
  PartialReceptionWrite,
  ReceptionPartielleDTO,
  CommandeFournisseurResponseDTO,
  LigneCommandeFournisseurResponseDTO,
  SupplierOrder,
  SupplierOrderWrite,
} from "../types";

/** `CommandeFournisseurResponseDTO` → `SupplierOrder` (int64 ids → string). */
export function toSupplierOrder(
  dto: CommandeFournisseurResponseDTO,
): SupplierOrder {
  return {
    id: String(dto.id),
    code: dto.code,
    date: dto.dateCommande,
    status: dto.statut,
    supplierId: String(dto.fournisseurId),
    supplierName: dto.fournisseurNom,
    lines: (dto.lignes ?? []).map(toSupplierOrderLine),
    total: dto.total ?? 0,
  };
}

/** `LigneCommandeFournisseurResponseDTO` → `SupplierOrderLine`. */
export function toSupplierOrderLine(dto: LigneCommandeFournisseurResponseDTO) {
  return {
    id: String(dto.id),
    articleId: String(dto.articleId),
    articleDesignation: dto.articleDesignation,
    quantity: dto.quantite,
    receivedQuantity: dto.quantiteRecue ?? 0,
    unitPrice: dto.prixUnitaire,
    subTotal: dto.sousTotal,
  };
}

/**
 * `PartialReceptionWrite` → `ReceptionPartielleDTO`.
 * Lines with nothing received are dropped: sending `quantiteRecue: 0` would
 * be a no-op row, and the contract only requires `ligneId` per entry.
 */
export function toReceptionPartielleRequest(
  input: PartialReceptionWrite,
): ReceptionPartielleDTO {
  const lignes: LigneRecueDTO[] = input.lines
    .filter((line) => line.receivedQuantity > 0)
    .map((line) => {
      const ligneId = Number(line.lineId);
      if (!Number.isSafeInteger(ligneId) || ligneId <= 0) {
        throw new Error(`ligneId invalide : ${line.lineId}`);
      }
      return { ligneId, quantiteRecue: line.receivedQuantity };
    });
  return { lignes };
}

/** `SupplierOrderWrite` → `CommandeFournisseurRequestDTO` (string ids → int64 with a safe-integer guard). */
export function toCommandeFournisseurRequest(
  input: SupplierOrderWrite,
): CommandeFournisseurRequestDTO {
  const toInt = (id: string, label: string): number => {
    const n = Number(id);
    if (!Number.isSafeInteger(n) || n <= 0)
      throw new Error(`${label} invalide : ${id}`);
    return n;
  };
  return {
    fournisseurId: toInt(input.supplierId, "fournisseurId"),
    lignes: input.lines.map((line) => ({
      articleId: toInt(line.articleId, "articleId"),
      quantite: line.quantity,
    })),
  };
}
