import { describe, expect, it } from "vitest";
import { buildSalesByDay, buildStockValueByCategory } from "./index";
import type { Sale } from "@/features/sales/types";
import type { Article } from "@/features/articles/types";

/**
 * Unit tests for the dashboard chart composition.
 * The /dashboard/charts endpoint does not exist in swagger v1.0 — both charts
 * are derived client-side from real sales + articles data.
 */

function daysAgo(n: number, hour = 12): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const sale = (overrides: Partial<Sale>): Sale => ({
  id: "1",
  code: "V1",
  date: daysAgo(0),
  customerId: null,
  customerName: null,
  lines: [],
  total: 100,
  ...overrides,
});

const article = (overrides: Partial<Article>): Article => ({
  id: "1",
  code: "ART-1",
  designation: "Clé",
  unitPriceHt: 10,
  vatRate: 0.2,
  unitPriceTtc: 12,
  currentStock: 5,
  minStock: 1,
  ...overrides,
});

describe("buildSalesByDay", () => {
  it("always returns 7 zero-filled day buckets in chronological order", () => {
    const series = buildSalesByDay([]);
    expect(series).toHaveLength(7);
    expect(series.every((p) => p.total === 0)).toBe(true);
    // Labels are short French weekday names without the trailing dot.
    for (const point of series) {
      expect(point.label).not.toMatch(/\.$/);
      expect(point.label.length).toBeGreaterThan(1);
    }
  });

  it("sums sales into the correct local-day bucket", () => {
    const series = buildSalesByDay([
      sale({ id: "1", total: 100, date: daysAgo(0) }),
      sale({ id: "2", total: 50, date: daysAgo(0, 18) }),
      sale({ id: "3", total: 70, date: daysAgo(1) }),
    ]);
    expect(series[6].total).toBe(150); // today
    expect(series[5].total).toBe(70); // yesterday
    expect(series[4].total).toBe(0);
  });

  it("ignores sales older than the 7-day window and unparseable dates", () => {
    const series = buildSalesByDay([
      sale({ id: "1", total: 999, date: daysAgo(10) }),
      sale({ id: "2", total: 5, date: "not-a-date" }),
      sale({ id: "3", total: 42, date: daysAgo(6) }),
    ]);
    expect(series[0].total).toBe(42);
    expect(series.reduce((s, p) => s + p.total, 0)).toBe(42);
  });
});

describe("buildStockValueByCategory", () => {
  it("groups stock × unitPriceHt by category designation", () => {
    const slices = buildStockValueByCategory([
      article({ id: "1", category: { id: "1", designation: "Outillage" } }),
      article({
        id: "2",
        unitPriceHt: 20,
        currentStock: 3,
        category: { id: "1", designation: "Outillage" },
      }),
      article({
        id: "3",
        unitPriceHt: 7,
        currentStock: 10,
        category: { id: "2", designation: "Électronique" },
      }),
    ]);
    expect(slices).toEqual([
      { name: "Outillage", value: 110 }, // 5×10 + 3×20
      { name: "Électronique", value: 70 }, // 10×7
    ]);
  });

  it('buckets uncategorized articles under "Sans catégorie" and sorts by value desc', () => {
    const slices = buildStockValueByCategory([
      article({ id: "1", unitPriceHt: 2, category: undefined }),
      article({
        id: "2",
        unitPriceHt: 9,
        currentStock: 2,
        category: undefined,
      }),
    ]);
    expect(slices).toEqual([{ name: "Sans catégorie", value: 28 }]);
  });
});
