import type { Category, CategorieResponseDTO } from "../types";

/**
 * DTO → domain mappers for the categories feature (roadmap P0.2).
 *
 * The backend speaks French DTOs with int64 ids (`CategorieResponseDTO`);
 * components must never see raw DTOs. One mapper per endpoint response.
 * Request validation lives in ../schemas (zod), not here.
 */

/** `CategorieResponseDTO` → `Category`. int64 ids are normalized to string. */
export function toCategory(dto: CategorieResponseDTO): Category {
  return {
    id: String(dto.id),
    code: dto.code,
    designation: dto.designation,
  };
}
