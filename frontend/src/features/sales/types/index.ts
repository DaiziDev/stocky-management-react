/**
 * Sales (POS) — real shapes pinned from swagger.json (roadmap P0.2 / P5.4).
 *
 * Backend resource: «ventes» (French). Components never see DTOs;
 * mapping happens in ../api/mappers.ts.
 *
 * Contract notes:
 *  - POST /api/ventes «Encaisser une vente»: sale + lines in one request,
 *    stock decremented immediately; refused as a whole (409) if stock is
 *    insufficient for any line.
 *  - `clientId` is OPTIONAL on the request (only `lignes` required) — the
 *    response may carry `clientId: null` with an empty/absent `clientNom`
 *    for anonymous walk-in sales.
 *  - Lines are server-priced: the request sends only { articleId, quantite }.
 *  - No PUT/DELETE — sales are immutable once created.
 */

/** Body of POST /api/ventes — swagger `VenteRequestDTO` (client optional). */
export interface VenteRequestDTO {
  clientId?: number;
  lignes: LigneVenteRequestDTO[];
}

export interface LigneVenteRequestDTO {
  articleId: number;
  quantite: number;
}

/** Response of GET/POST /api/ventes — swagger `VenteResponseDTO`. */
export interface VenteResponseDTO {
  id: number;
  code: string;
  /** ISO date-time. */
  dateVente: string;
  clientId?: number | null;
  clientNom?: string | null;
  lignes: LigneVenteResponseDTO[];
  total: number;
}

export interface LigneVenteResponseDTO {
  id: number;
  articleId: number;
  articleDesignation: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

/**
 * Domain sale — mapped from `VenteResponseDTO` in ../api/mappers.ts.
 * Type alias (not interface) for TanStack Table v9's `RowData` constraint.
 */
export type Sale = {
  id: string;
  code: string;
  date: string;
  /** null = anonymous walk-in customer. */
  customerId: string | null;
  customerName: string | null;
  lines: SaleLine[];
  total: number;
};

export type SaleLine = {
  id: string;
  articleId: string;
  articleDesignation: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
};

/** Checkout payload — the sale and its cart lines in one request. */
export type SaleWrite = {
  customerId?: string;
  lines: Array<{ articleId: string; quantity: number }>;
};
