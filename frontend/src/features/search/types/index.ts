/**
 * Search — display-only contracts (P0 re-sync).
 *
 * The fan-out (../api) reads each feature's pinned domain types directly and
 * projects onto these plain shapes, so search has no dependency on
 * common.types (retired aspirational models).
 */

export type SearchableEntity =
  | "articles"
  | "customers"
  | "suppliers"
  | "customer-orders"
  | "supplier-orders";

export interface SearchGroup {
  entity: SearchableEntity;
  /** Present when the per-entity request rejected (partial-failure tolerance). */
  error?: unknown;
  total: number;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    meta?: string;
    href: string;
  }>;
}

export interface EntitySearchResponse {
  query: string;
  groups: SearchGroup[];
  totalHits: number;
}
