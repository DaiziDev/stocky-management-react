import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercentage,
  formatQuantity,
  formatStockStatus,
  formatOrderStatus,
  formatPaymentStatus,
} from "./formatters";

/** fr-FR separates groups and the symbol with non-breaking spaces. */
const plain = (value: string): string => value.replace(/ | /g, " ");

describe("formatCurrency", () => {
  it("defaults to the app currency (franc CFA) with NO decimals", () => {
    // XAF is a zero-decimal currency: "1 235 FCFA", never "1 234,50 FCFA".
    const out = plain(formatCurrency(1234.5));
    expect(out).toMatch(/1 235/);
    expect(out).not.toMatch(/[.,]\d\d/);
    expect(out).toContain("FCFA");
  });

  it("keeps each currency's own precision when one is passed", () => {
    const out = plain(formatCurrency(1234.5, "EUR"));
    expect(out).toMatch(/1 234[.,]50/);
    expect(out).toContain("€");
  });

  it("formats zero and negative amounts", () => {
    expect(formatCurrency(0)).toContain("0");
    expect(plain(formatCurrency(-42))).toContain("-");
  });
});

describe("formatDate / formatDateTime", () => {
  it("formats an ISO date string in fr-FR", () => {
    const out = formatDate("2026-09-16T10:30:00Z");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/sept/);
  });

  it("formatDateTime includes the time", () => {
    const out = formatDateTime("2026-09-16T10:30:00Z");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("formatPercentage / formatQuantity", () => {
  it("formats a percentage with default decimals", () => {
    expect(formatPercentage(20)).toBe("20.0%");
    expect(formatPercentage(12.345, 2)).toBe("12.35%");
  });

  it("formats quantities with an optional unit", () => {
    expect(formatQuantity(1500)).toMatch(/1[\u202f\u00a0 ]?500/);
    expect(formatQuantity(3, "kg")).toMatch(/3 kg/);
  });
});

describe("formatStockStatus", () => {
  it("maps zero/negative stock to Rupture (danger)", () => {
    expect(formatStockStatus(0, 5)).toEqual({
      label: "Rupture",
      variant: "danger",
    });
    expect(formatStockStatus(-2, 5)).toEqual({
      label: "Rupture",
      variant: "danger",
    });
  });

  it("maps stock at or below threshold to Stock faible (warning)", () => {
    expect(formatStockStatus(5, 5)).toEqual({
      label: "Stock faible",
      variant: "warning",
    });
    expect(formatStockStatus(3, 5)).toEqual({
      label: "Stock faible",
      variant: "warning",
    });
  });

  it("maps stock above threshold to En stock (success)", () => {
    expect(formatStockStatus(6, 5)).toEqual({
      label: "En stock",
      variant: "success",
    });
  });

  it("treats a zero threshold as in-stock for any positive quantity", () => {
    expect(formatStockStatus(1, 0)).toEqual({
      label: "En stock",
      variant: "success",
    });
  });
});

describe("formatOrderStatus / formatPaymentStatus", () => {
  it("maps known order statuses to French labels + variants", () => {
    expect(formatOrderStatus("DELIVERED")).toEqual({
      label: "Livré",
      variant: "success",
    });
    expect(formatOrderStatus("CANCELLED").variant).toBe("danger");
  });

  it("falls back to the raw status for unknown values", () => {
    expect(formatOrderStatus("WEIRD")).toEqual({
      label: "WEIRD",
      variant: "default",
    });
    expect(formatPaymentStatus("WEIRD")).toEqual({
      label: "WEIRD",
      variant: "default",
    });
  });

  it("maps known payment statuses", () => {
    expect(formatPaymentStatus("PAID")).toEqual({
      label: "Payé",
      variant: "success",
    });
  });
});
