import type {
  CommandeClientRequestDTO,
  CommandeClientResponseDTO,
  CustomerOrder,
  CustomerOrderWrite,
  LigneCommandeResponseDTO,
} from "../types";

/** `CommandeClientResponseDTO` → `CustomerOrder` (int64 ids → string). */
export function toCustomerOrder(dto: CommandeClientResponseDTO): CustomerOrder {
  return {
    id: String(dto.id),
    code: dto.code,
    date: dto.dateCommande,
    status: dto.statut,
    clientId: String(dto.clientId),
    customerName: dto.clientNom,
    lines: (dto.lignes ?? []).map(toOrderLine),
    total: dto.total ?? 0,
  };
}

/** `LigneCommandeResponseDTO` → `OrderLine`. */
export function toOrderLine(dto: LigneCommandeResponseDTO) {
  return {
    id: String(dto.id),
    articleId: String(dto.articleId),
    articleDesignation: dto.articleDesignation,
    quantity: dto.quantite,
    unitPrice: dto.prixUnitaire,
    subTotal: dto.sousTotal,
  };
}

/** `CustomerOrderWrite` → `CommandeClientRequestDTO` (string ids → int64 with a safe-integer guard). */
export function toCommandeClientRequest(
  input: CustomerOrderWrite,
): CommandeClientRequestDTO {
  const toInt = (id: string, label: string): number => {
    const n = Number(id);
    if (!Number.isSafeInteger(n) || n <= 0)
      throw new Error(`${label} invalide : ${id}`);
    return n;
  };
  return {
    clientId: toInt(input.customerId, "clientId"),
    lignes: input.lines.map((line) => ({
      articleId: toInt(line.articleId, "articleId"),
      quantite: line.quantity,
    })),
  };
}
