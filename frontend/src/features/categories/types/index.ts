/**
 * Categories — real shapes pinned from swagger.json (roadmap P0.2).
 *
 * Backend DTOs (components.schemas in swagger.json) use French field names
 * and int64 ids. The domain model below is the only shape hooks/components
 * ever see; DTO → domain mapping happens in ../api/mappers.ts.
 */

/** Raw response body of GET/POST/PUT /api/categories — swagger `CategorieResponseDTO`. */
export interface CategorieResponseDTO {
  /** int64 in swagger; converted to string by the mapper (see Category.id). */
  id: number;
  code: string;
  designation: string;
}

/** Request body of POST/PUT /api/categories — swagger `CategorieRequestDTO` (both fields required). */
export interface CategorieRequestDTO {
  code: string;
  designation: string;
}

/**
 * Domain model — mapped from `CategorieResponseDTO` in ../api/mappers.ts.
 * A type alias (not interface) so it satisfies TanStack Table v9's
 * `RowData` constraint (implicit index signatures) in the DataTable.
 */
export type Category = {
  /** int64 in swagger; kept as string domain-wide to avoid JS precision loss on int64. */
  id: string;
  code: string;
  designation: string;
};
