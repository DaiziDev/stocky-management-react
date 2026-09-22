import type {
  Article,
  ArticleRequestDTO,
  ArticleResponseDTO,
  ArticleWrite,
  CategorieSummary,
  CategorieSummaryDTO,
} from "../types";

/**
 * DTO → domain mappers for the articles feature (roadmap P0.2).
 *
 * The backend speaks French DTOs with int64 ids (`ArticleResponseDTO`);
 * components must never see raw DTOs. One mapper per endpoint response.
 * Request validation lives in ../schemas (zod), not here.
 */

/** `CategorieSummaryDTO` → `CategorieSummary`. int64 id normalized to string. */
export function toCategorieSummary(dto: CategorieSummaryDTO): CategorieSummary {
  return {
    id: String(dto.id),
    designation: dto.designation,
  };
}

/**
 * `ArticleResponseDTO` → `Article`.
 * - int64 ids → string (article id and nested category id).
 * - Optional fields (photo, stockActuel, seuilMin) defaulted so components
 *   never null-check backend omissions.
 * - `unitPriceTtc` recomputed client-side rather than trusting the server's
 *   `prixUnitaireTtc`.
 * - VAT convention: the wire `tauxTva` is a PERCENTAGE (20 = 20%; verified
 *   live — the server computes TTC = HT × (1 + tauxTva/100)), while the
 *   domain keeps a decimal fraction (0.2 = 20%). Converted here, at the only
 *   boundary the DTOs cross.
 */
export function toArticle(dto: ArticleResponseDTO): Article {
  return {
    id: String(dto.id),
    code: dto.codeArticle,
    designation: dto.designation,
    unitPriceHt: dto.prixUnitaireHt,
    // Wire percentage → domain decimal fraction (20 → 0.2).
    vatRate: dto.tauxTva / 100,
    // Same formula as the server (HT × (1 + tauxTva/100)).
    unitPriceTtc: dto.prixUnitaireHt * (1 + dto.tauxTva / 100),
    // The API may serialize the optional photo as an empty string. Normalize
    // it so the hidden form field does not fail URL validation on edit.
    photo: dto.photo?.trim() || undefined,
    currentStock: dto.stockActuel ?? 0,
    minStock: dto.seuilMin ?? 0,
    category: dto.categorie ? toCategorieSummary(dto.categorie) : undefined,
  };
}

/**
 * `ArticleWrite` → `ArticleRequestDTO` (POST/PUT body).
 * Domain ids are strings; the wire format needs int64-compatible numbers,
 * so `categoryId` is parsed here — zod validates the digits, this enforces
 * the conversion at the only place the wire format is built.
 */
export function toArticleRequest(input: ArticleWrite): ArticleRequestDTO {
  const categoryId = Number(input.categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
    throw new Error(
      `Article.categoryId must be a safe positive integer (got "${input.categoryId}")`,
    );
  }
  return {
    codeArticle: input.code,
    designation: input.designation,
    prixUnitaireHt: input.unitPriceHt,
    // Domain decimal fraction → wire percentage (0.2 → 20).
    tauxTva: input.vatRate * 100,
    photo: input.photo,
    seuilMin: input.minStock,
    categorieId: categoryId,
  };
}
