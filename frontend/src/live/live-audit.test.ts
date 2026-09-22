// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import apiClient from "@/api/client";
import { authApi } from "@/features/auth/api";
import { CategoriesApi } from "@/features/categories/api";
import { ArticlesApi } from "@/features/articles/api";
import { CompaniesApi } from "@/features/companies/api";
import { UsersApi } from "@/features/users/api";
import { CustomersApi } from "@/features/customers/api";
import { SuppliersApi } from "@/features/suppliers/api";
import { CustomerOrdersApi } from "@/features/customer-orders/api";
import { SupplierOrdersApi } from "@/features/supplier-orders/api";
import { SalesApi } from "@/features/sales/api";
import { StockApi } from "@/features/stock/api";
import { NotificationsApi } from "@/features/notifications/api";
import { DashboardApi } from "@/features/dashboard/api";

/**
 * LIVE backend audit (networked).
 * Opt-in ONLY: runs when invoked via `npm run test:live` (the script name
 * contains "live") or with LIVE=1. Plain `npm test` and CI skip it.
 */
const nodeProcess = (
  globalThis as {
    process?: {
      env: Record<string, string | undefined>;
      npm_lifecycle_event?: string;
    };
  }
).process;
const RUN_LIVE =
  !!nodeProcess?.env.LIVE ||
  (nodeProcess?.npm_lifecycle_event ?? "").includes("live");

const LOGIN = "admin@sgs.local";
const PASSWORD = "admin123";

// Node environment has no localStorage — the auth API + interceptor use it.
const mem = new Map<string, string>();
beforeAll(() => {
  // Minimal window stub — handleAuthFailure reads window.location.pathname
  // (exists in the browser; the node env needs it only for this probe).
  (globalThis as { window?: unknown }).window = {
    location: { pathname: "/test" },
  };
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  } as Storage;
  // The .env baseURL (/api) is for the browser proxy; from node, go direct.
  apiClient.defaults.baseURL = "http://localhost:8081/api";
});

describe.skipIf(!RUN_LIVE)("LIVE auth", () => {
  it("rejects a wrong password with the backend message (error loop)", async () => {
    const err = await authApi
      .login({ login: LOGIN, motDePasse: "definitely-wrong" })
      .catch((e: unknown) => e);
    const status = (err as { status?: number }).status;
    const message = (err as { message?: string }).message;
    console.log("  ↳ wrong-password →", status, JSON.stringify(message));
    expect(status).toBe(401);
    expect(message).toBeTruthy();
  });

  it("logs in with the real credentials and stores the token", async () => {
    const user = await authApi.login({ login: LOGIN, motDePasse: PASSWORD });
    console.log("  ↳ logged in as", user.login, user.roles);
    expect(user).toBeTruthy();
    expect(localStorage.getItem("access_token")).toBeTruthy();
  });

  it("resolves the session via GET /auth/me (bootstrap path)", async () => {
    const me = await authApi.me();
    expect(me).not.toBeNull();
    console.log("  ↳ /auth/me →", me?.login, me?.roles);
  });
});

describe.skipIf(!RUN_LIVE)("LIVE reference data (read-only)", () => {
  it("categories: GET list maps cleanly", async () => {
    const rows = await CategoriesApi.getAll();
    console.log(
      "  ↳ categories:",
      rows.length,
      rows[0] ? `${rows[0].code} / ${rows[0].designation}` : "",
    );
    expect(Array.isArray(rows)).toBe(true);
  });

  it("articles: GET list maps cleanly (incl. nested category)", async () => {
    const rows = await ArticlesApi.getAll();
    const a = rows[0];
    console.log(
      "  ↳ articles:",
      rows.length,
      a
        ? `${a.code} ttc=${a.unitPriceTtc} stock=${a.currentStock} cat=${a.category?.designation ?? "—"}`
        : "",
    );
    expect(Array.isArray(rows)).toBe(true);
  });

  it("companies: GET list maps cleanly", async () => {
    const rows = await CompaniesApi.getAll();
    console.log("  ↳ entreprises:", rows.length);
    expect(Array.isArray(rows)).toBe(true);
  });

  it("users: GET list maps cleanly", async () => {
    const rows = await UsersApi.getAll();
    console.log("  ↳ utilisateurs:", rows.length, rows[0]?.login ?? "");
    expect(Array.isArray(rows)).toBe(true);
  });

  it("customers: GET list maps cleanly", async () => {
    const rows = await CustomersApi.getAll();
    console.log("  ↳ clients:", rows.length);
    expect(Array.isArray(rows)).toBe(true);
  });

  it("suppliers: GET list maps cleanly", async () => {
    const rows = await SuppliersApi.getAll();
    console.log("  ↳ fournisseurs:", rows.length);
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe.skipIf(!RUN_LIVE)("LIVE transactions (read-only)", () => {
  it("customer-orders: GET list maps cleanly", async () => {
    const rows = await CustomerOrdersApi.getAll();
    const o = rows[0];
    console.log(
      "  ↳ commandes-client:",
      rows.length,
      o
        ? `${o.code} ${o.status} total=${o.total} lignes=${o.lines.length}`
        : "",
    );
    expect(Array.isArray(rows)).toBe(true);
  });

  it("supplier-orders: GET list maps cleanly", async () => {
    const rows = await SupplierOrdersApi.getAll();
    console.log("  ↳ commandes-fournisseur:", rows.length);
    expect(Array.isArray(rows)).toBe(true);
  });

  it("sales: GET list maps cleanly (lines + totals)", async () => {
    const rows = await SalesApi.getAll();
    const s = rows[0];
    console.log(
      "  ↳ ventes:",
      rows.length,
      s
        ? `${s.code} total=${s.total} lignes=${s.lines.length} client=${s.customerName ?? "anonyme"}`
        : "",
    );
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe.skipIf(!RUN_LIVE)(
  "LIVE stock + notifications + dashboard (read-only)",
  () => {
    it("stock etat / alertes / valorisation / mouvements", async () => {
      const etat = await StockApi.getEtat();
      const alertes = await StockApi.getAlertes();
      const valeur = await StockApi.getValorisation();
      const mvts = await StockApi.getMovements();
      console.log(
        `  ↳ etat=${etat.length} alertes=${alertes.length} valorisation=${valeur} mouvements=${mvts.length}`,
      );
      expect(Array.isArray(etat)).toBe(true);
      expect(typeof valeur).toBe("number");
    });

    it("notifications: GET list maps cleanly", async () => {
      const rows = await NotificationsApi.getAll();
      console.log("  ↳ notifications:", rows.length, rows[0]?.type ?? "");
      expect(Array.isArray(rows)).toBe(true);
    });

    it("dashboard: KPIs from the real endpoint", async () => {
      const k = await DashboardApi.getKPIs();
      console.log("  ↳ kpis:", JSON.stringify(k));
      expect(typeof k.stockValue).toBe("number");
    });

    it("dashboard: charts composed from live sales + articles", async () => {
      const c = await DashboardApi.getCharts();
      console.log(
        "  ↳ charts: salesByDay",
        c.salesByDay.length,
        "points, total CA(7j)=",
        c.salesByDay.reduce((s, p) => s + p.total, 0).toFixed(2),
        "| donut slices:",
        c.stockValueByCategory.length,
      );
      expect(c.salesByDay).toHaveLength(7);
    });
  },
);

describe.skipIf(!RUN_LIVE)("LIVE write cycle (self-cleaning)", () => {
  it("customers: create → list (non-empty mapping) → delete", async () => {
    const created = await CustomersApi.create({
      firstName: "Audit",
      lastName: `Probe${Date.now() % 100000}`,
      email: "audit.probe@test.fr",
    });
    expect(created.id).toBeTruthy();
    const list = await CustomersApi.getAll();
    const found = list.find((c) => c.id === created.id);
    expect(found?.lastName).toBe(created.lastName);
    await CustomersApi.delete(created.id);
    console.log(
      "  ↳ customer cycle OK:",
      found?.firstName,
      found?.lastName,
      found?.email,
    );
  });

  it("articles: create → list (nested category mapping) → delete", async () => {
    const cats = await CategoriesApi.getAll();
    let categoryId: string | undefined = cats[0]?.id;
    const createdCategoryId = !cats[0]
      ? (
          await CategoriesApi.create({
            code: `AUDITCAT-${Date.now() % 100000}`,
            designation: "Audit cat",
          })
        ).id
      : undefined;
    categoryId = categoryId ?? createdCategoryId;

    const code = `AUDIT-ART-${Date.now() % 100000}`;
    const created = await ArticlesApi.create({
      code,
      designation: "Article audit",
      unitPriceHt: 15.5,
      vatRate: 0.2, // domain decimal → wire tauxTva 20 (verified: server TTC = HT × (1 + tauxTva/100))
      minStock: 2,
      categoryId: categoryId!,
    });
    expect(created.id).toBeTruthy();
    const list = await ArticlesApi.getAll();
    const found = list.find((a) => a.id === created.id);
    expect(found?.unitPriceTtc).toBeCloseTo(18.6, 2);
    expect(found?.category?.id).toBe(categoryId);
    await ArticlesApi.delete(created.id);
    if (createdCategoryId) await CategoriesApi.delete(createdCategoryId);
    console.log(
      "  ↳ article cycle OK:",
      found?.code,
      "ttc=",
      found?.unitPriceTtc,
      "cat=",
      found?.category?.designation,
    );
  });

  it("categories: create → update → delete (no residue)", async () => {
    const created = await CategoriesApi.create({
      code: `AUDIT-${Date.now() % 100000}`,
      designation: "Audit temp",
    });
    expect(created.id).toBeTruthy();
    const updated = await CategoriesApi.update(created.id, {
      code: created.code,
      designation: "Audit temp modifié",
    });
    expect(updated.designation).toBe("Audit temp modifié");
    await CategoriesApi.delete(created.id);
    const after = await CategoriesApi.getAll();
    expect(after.find((c) => c.id === created.id)).toBeUndefined();
    console.log("  ↳ create/update/delete cycle OK, residue cleaned");
  });
});
