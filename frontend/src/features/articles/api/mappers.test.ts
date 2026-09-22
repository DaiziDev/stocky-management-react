import { describe, it, expect } from "vitest";
import { toArticle, toArticleRequest } from "./mappers";
import type { ArticleResponseDTO } from "../types";

describe("toArticle (DTO → domain)", () => {
  it("maps the full DTO including the nested category summary", () => {
    const dto: ArticleResponseDTO = {
      id: 123,
      codeArticle: "ART-001",
      designation: "Clé à molette",
      prixUnitaireHt: 20,
      tauxTva: 20, // wire = percentage (20 = 20%)
      stockActuel: 10,
      seuilMin: 3,
      categorie: { id: 7, designation: "Outillage" },
    };

    const article = toArticle(dto);
    expect(article.id).toBe("123"); // int64 → string
    expect(article.code).toBe("ART-001");
    expect(article.designation).toBe("Clé à molette");
    expect(article.unitPriceHt).toBe(20);
    expect(article.vatRate).toBe(0.2); // domain = decimal fraction
    expect(article.currentStock).toBe(10);
    expect(article.minStock).toBe(3);
    expect(article.category).toEqual({ id: "7", designation: "Outillage" });
  });

  it("recomputes TTC with the server formula HT × (1 + tauxTva/100) rather than trusting the wire", () => {
    const article = toArticle({
      id: 1,
      codeArticle: "A",
      designation: "B",
      prixUnitaireHt: 100,
      tauxTva: 20, // 20% on the wire
      prixUnitaireTtc: 999, // wrong value on the wire must be ignored
    });
    expect(article.unitPriceTtc).toBeCloseTo(120);
  });

  it("normalizes an empty photo so edit forms can submit", () => {
    const article = toArticle({
      id: 6,
      codeArticle: "EMPTY-PHOTO",
      designation: "Sans photo",
      prixUnitaireHt: 1,
      tauxTva: 0,
      photo: "   ",
    });
    expect(article.photo).toBeUndefined();
  });

  it("defaults optional backend omissions", () => {
    const article = toArticle({
      id: 5,
      codeArticle: "X",
      designation: "Y",
      prixUnitaireHt: 1,
      tauxTva: 0,
    });
    expect(article.category).toBeUndefined();
    expect(article.currentStock).toBe(0);
    expect(article.minStock).toBe(0);
    expect(article.photo).toBeUndefined();
  });
});

describe("toArticleRequest (domain → wire)", () => {
  it("maps camelCase fields to the French DTO and converts the id to int64", () => {
    const out = toArticleRequest({
      code: "ART-9",
      designation: "Vis",
      unitPriceHt: 0.5,
      vatRate: 0.055, // 5.5% as a decimal fraction
      photo: "https://x/y.png",
      minStock: 10,
      categoryId: "7",
    });
    expect(out).toEqual({
      codeArticle: "ART-9",
      designation: "Vis",
      prixUnitaireHt: 0.5,
      tauxTva: 5.5, // wire percentage
      photo: "https://x/y.png",
      seuilMin: 10,
      categorieId: 7,
    });
  });

  it("rejects unsafe or non-positive ids", () => {
    expect(() => toArticleRequest({} as never)).toThrow();
    expect(() =>
      toArticleRequest({
        code: "A",
        designation: "B",
        unitPriceHt: 1,
        vatRate: 0,
        categoryId: "9007199254740993", // > Number.MAX_SAFE_INTEGER
      } as never),
    ).toThrow();
  });
});
