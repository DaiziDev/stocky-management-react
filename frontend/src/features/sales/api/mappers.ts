import type {
  LigneVenteResponseDTO,
  Sale,
  SaleLine,
  SaleWrite,
  VenteRequestDTO,
} from "../types";

/** `VenteResponseDTO` → `Sale` (int64 ids → string, optional client preserved). */
export function toSale(dto: {
  id: number;
  code: string;
  dateVente: string;
  clientId?: number | null;
  clientNom?: string | null;
  lignes?: LigneVenteResponseDTO[];
  total?: number;
}): Sale {
  return {
    id: String(dto.id),
    code: dto.code,
    date: dto.dateVente,
    customerId: dto.clientId != null ? String(dto.clientId) : null,
    customerName: dto.clientNom ?? null,
    lines: (dto.lignes ?? []).map(toSaleLine),
    total: dto.total ?? 0,
  };
}

/** `LigneVenteResponseDTO` → `SaleLine`. */
export function toSaleLine(dto: LigneVenteResponseDTO): SaleLine {
  return {
    id: String(dto.id),
    articleId: String(dto.articleId),
    articleDesignation: dto.articleDesignation,
    quantity: dto.quantite,
    unitPrice: dto.prixUnitaire,
    subTotal: dto.sousTotal,
  };
}

/** `SaleWrite` → `VenteRequestDTO` (string ids → int64 with a safe-integer guard). */
export function toVenteRequest(input: SaleWrite): VenteRequestDTO {
  const toInt = (id: string, label: string): number => {
    const n = Number(id);
    if (!Number.isSafeInteger(n) || n <= 0)
      throw new Error(`${label} invalide : ${id}`);
    return n;
  };
  return {
    clientId: input.customerId
      ? toInt(input.customerId, "clientId")
      : undefined,
    lignes: input.lines.map((line) => ({
      articleId: toInt(line.articleId, "articleId"),
      quantite: line.quantity,
    })),
  };
}
