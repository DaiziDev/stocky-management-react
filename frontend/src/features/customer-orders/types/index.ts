/**
 * Customer orders — real shapes pinned from swagger.json (roadmap P0.2 / P4.2).
 *
 * Backend resource: «commandes-client» (French). Components never see DTOs;
 * mapping happens in ../api/mappers.ts.
 *
 * Contract notes:
 *  - `total` is server-computed from the lines; the client recomputes it as a
 *    sanity fallback but trusts the wire value when present.
 *  - Lines carry `prixUnitaire`/`sousTotal` read-only — the request sends only
 *    { articleId, quantite } and the backend prices the lines.
 *  - Lifecycle is linear and one-way:
 *        EN_COURS ──valider──▶ VALIDEE ──expedier──▶ EXPEDIEE ──livrer──▶ LIVREE
 *           └──annuler──▶ ANNULEE
 *    `valider` generates the stock exits (409 if stock is insufficient) and
 *    `annuler` is only accepted while the order is still EN_COURS.
 *    There is no delete endpoint — cancellation is the terminal escape.
 */

export type OrderStatus =
  "EN_COURS" | "VALIDEE" | "EXPEDIEE" | "LIVREE" | "ANNULEE";

/**
 * Which action each status allows, derived from the lifecycle above. Kept
 * next to the type so a future status cannot silently gain every action.
 */
export const ORDER_TRANSITIONS: Record<
  OrderStatus,
  { validate: boolean; ship: boolean; deliver: boolean; cancel: boolean }
> = {
  EN_COURS: { validate: true, ship: false, deliver: false, cancel: true },
  VALIDEE: { validate: false, ship: true, deliver: false, cancel: false },
  EXPEDIEE: { validate: false, ship: false, deliver: true, cancel: false },
  LIVREE: { validate: false, ship: false, deliver: false, cancel: false },
  ANNULEE: { validate: false, ship: false, deliver: false, cancel: false },
};

/** Body of POST /api/commandes-client — swagger `CommandeClientRequestDTO`. */
export interface CommandeClientRequestDTO {
  clientId: number;
  lignes: LigneCommandeRequestDTO[];
}

export interface LigneCommandeRequestDTO {
  articleId: number;
  quantite: number;
}

/** Response of GET/POST/PUT — swagger `CommandeClientResponseDTO`. */
export interface CommandeClientResponseDTO {
  id: number;
  code: string;
  /** ISO date-time. */
  dateCommande: string;
  statut: OrderStatus;
  clientId: number;
  clientNom: string;
  lignes: LigneCommandeResponseDTO[];
  total: number;
}

export interface LigneCommandeResponseDTO {
  id: number;
  articleId: number;
  articleDesignation: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

/**
 * Domain order — mapped from `CommandeClientResponseDTO` in ../api/mappers.ts.
 * Type alias (not interface) for TanStack Table v9's `RowData` constraint.
 */
export type CustomerOrder = {
  id: string;
  code: string;
  date: string;
  status: OrderStatus;
  clientId: string;
  /** `clientNom` — denormalized label sent by the backend. */
  customerName: string;
  lines: OrderLine[];
  total: number;
};

export type OrderLine = {
  id: string;
  articleId: string;
  articleDesignation: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
};

/** Create payload — the order and its lines in one request. */
export type CustomerOrderWrite = {
  customerId: string;
  lines: Array<{ articleId: string; quantity: number }>;
};
