/**
 * Articles — real shapes pinned from swagger.json (roadmap P0.2).
 *
 * Backend DTOs use French field names and int64 ids. Components never see
 * these; DTO → domain mapping happens in ../api/mappers.ts.
 */

/** Request body of POST/PUT /api/articles — swagger `ArticleRequestDTO`. */
export interface ArticleRequestDTO {
  codeArticle: string;
  designation: string;
  prixUnitaireHt: number;
  /** PERCENTAGE server-side (20 = 20%) — verified live: TTC = HT × (1 + tauxTva/100). The mapper converts from the domain's decimal fraction. */
  tauxTva: number;
  photo?: string;
  seuilMin?: number;
  /** int64 in swagger; sent as number — see mapper note on id width. */
  categorieId: number;
}

/** Raw response body of GET/POST/PUT /api/articles — swagger `ArticleResponseDTO`. */
export interface ArticleResponseDTO {
  id: number;
  codeArticle: string;
  designation: string;
  prixUnitaireHt: number;
  tauxTva: number;
  /** Server-computed (prixUnitaireHt × (1 + tauxTva/100)); mapper recomputes instead of trusting. */
  prixUnitaireTtc?: number;
  photo?: string;
  stockActuel?: number;
  seuilMin?: number;
  /** Nested category reference — full shape only via /api/categories/{id}. */
  categorie?: CategorieSummaryDTO;
}

/** Nested category summary — swagger `CategorieSummaryDTO` (id: int64). */
export interface CategorieSummaryDTO {
  id: number;
  designation: string;
}

/**
 * Domain model — mapped from `ArticleResponseDTO` in ../api/mappers.ts.
 * Type aliases (not interfaces) to satisfy TanStack Table v9's `RowData`
 * constraint (implicit index signatures) in the DataTable.
 */
export type Article = {
  /** int64 in swagger; kept as string domain-wide to avoid JS precision loss on int64. */
  id: string;
  code: string;
  designation: string;
  unitPriceHt: number;
  /** Decimal fraction domain-wide (0.2 = 20%); the wire carries a percentage — mappers convert ×100 / ÷100. */
  vatRate: number;
  /** Client-recomputed with the server's formula (HT × (1 + tauxTva/100)) — never trusted from the server. */
  unitPriceTtc: number;
  photo?: string;
  currentStock: number;
  minStock: number;
  /** Nested category summary, normalized with a string id. */
  category?: CategorieSummary;
};

/** Domain model for the nested category reference (from `CategorieSummaryDTO`). */
export type CategorieSummary = {
  id: string;
  designation: string;
};

/** Client-side write input for POST/PUT — string ids, English domain names. */
export interface ArticleWrite {
  code: string;
  designation: string;
  unitPriceHt: number;
  /** Decimal fraction domain-wide (0.2 = 20%); converted to a percentage at the wire boundary. */
  vatRate: number;
  photo?: string;
  minStock?: number;
  /** Category id as string (domain-wide id convention); converted to int64 on the wire. */
  categoryId: string;
}
