/**
 * Supplier orders — real shapes pinned from swagger.json (roadmap P0.2 / P4.3).
 *
 * Backend resource: «commandes-fournisseur» (French). Components never see
 * DTOs; mapping happens in ../api/mappers.ts.
 *
 * Contract notes:
 *  - Status lifecycle differs from customer orders:
 *        EN_ATTENTE ──receptionner-partiel──▶ RECUE_PARTIELLEMENT
 *                   ──receptionner─────────▶ RECUE
 *                   ──annuler──────────────▶ ANNULEE
 *    A partially received order can keep receiving until it is complete.
 *  - PUT /{id}/receptionner generates a stock *entry* per line for the full
 *    ordered quantity; refused if the order was already fully received.
 *  - PUT /{id}/receptionner-partiel takes the quantity actually received per
 *    line, so a short delivery does not inflate stock.
 *  - Lines are server-priced — the request sends only { articleId, quantite }.
 *  - No delete endpoint; cancellation is the terminal flow.
 */

export type SupplierOrderStatus =
  "EN_ATTENTE" | "RECUE_PARTIELLEMENT" | "RECUE" | "ANNULEE";

/** Which actions each status allows, per the lifecycle above. */
export const SUPPLIER_ORDER_TRANSITIONS: Record<
  SupplierOrderStatus,
  { receive: boolean; receivePartial: boolean; cancel: boolean }
> = {
  EN_ATTENTE: { receive: true, receivePartial: true, cancel: true },
  RECUE_PARTIELLEMENT: { receive: true, receivePartial: true, cancel: false },
  RECUE: { receive: false, receivePartial: false, cancel: false },
  ANNULEE: { receive: false, receivePartial: false, cancel: false },
};

/** Body of PUT /{id}/receptionner-partiel — swagger `ReceptionPartielleDTO`. */
export interface ReceptionPartielleDTO {
  lignes: LigneRecueDTO[];
}

/** One received line — `quantiteRecue` is optional in the contract (min 0). */
export interface LigneRecueDTO {
  ligneId: number;
  quantiteRecue?: number;
}

/** Client-side input for a partial reception. */
export type PartialReceptionWrite = {
  lines: Array<{ lineId: string; receivedQuantity: number }>;
};

/** Body of POST /api/commandes-fournisseur — swagger `CommandeFournisseurRequestDTO`. */
export interface CommandeFournisseurRequestDTO {
  fournisseurId: number;
  lignes: LigneCommandeFournisseurRequestDTO[];
}

export interface LigneCommandeFournisseurRequestDTO {
  articleId: number;
  quantite: number;
}

/** Response of GET/POST/PUT — swagger `CommandeFournisseurResponseDTO`. */
export interface CommandeFournisseurResponseDTO {
  id: number;
  code: string;
  /** ISO date-time. */
  dateCommande: string;
  statut: SupplierOrderStatus;
  fournisseurId: number;
  fournisseurNom: string;
  lignes: LigneCommandeFournisseurResponseDTO[];
  total: number;
}

export interface LigneCommandeFournisseurResponseDTO {
  id: number;
  articleId: number;
  articleDesignation: string;
  quantite: number;
  /** Cumulative quantity already received for this line (partial receptions). */
  quantiteRecue?: number;
  prixUnitaire: number;
  sousTotal: number;
}

/**
 * Domain order — mapped from `CommandeFournisseurResponseDTO` in ../api/mappers.ts.
 * Type alias (not interface) for TanStack Table v9's `RowData` constraint.
 */
export type SupplierOrder = {
  id: string;
  code: string;
  date: string;
  status: SupplierOrderStatus;
  supplierId: string;
  /** `fournisseurNom` — denormalized label sent by the backend. */
  supplierName: string;
  lines: SupplierOrderLine[];
  total: number;
};

export type SupplierOrderLine = {
  id: string;
  articleId: string;
  articleDesignation: string;
  quantity: number;
  /** Already received; 0 until a reception happens. */
  receivedQuantity: number;
  unitPrice: number;
  subTotal: number;
};

/** Create payload — the order and its lines in one request. */
export type SupplierOrderWrite = {
  supplierId: string;
  lines: Array<{ articleId: string; quantity: number }>;
};
